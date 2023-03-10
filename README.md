**UPDATE!:** 

# Diagram: 

**OPEN IN** `draw.io` application or on sine (app.diagrams.net) as uml diagram! Not as image!

[comment]: <> ( this is old links with old diagram)

[comment]: <> (https://drive.google.com/file/d/15XmuINoOT5RfVd5xvlK1EuHchphPYOdG/view?usp=sharing)
[comment]: <> (https://app.diagrams.net/#G15XmuINoOT5RfVd5xvlK1EuHchphPYOdG)

https://viewer.diagrams.net/?tags=%7B%7D&highlight=0000ff&edit=_blank&layers=1&nav=1&title=%D0%94%D0%B8%D0%B0%D0%B3%D1%80%D0%B0%D0%BC%D0%BC%D0%B0%20%D0%B1%D0%B5%D0%B7%20%D0%BD%D0%B0%D0%B7%D0%B2%D0%B0%D0%BD%D0%B8%D1%8F.drawio#Uhttps%3A%2F%2Fdrive.google.com%2Fuc%3Fid%3D15XmuINoOT5RfVd5xvlK1EuHchphPYOdG%26export%3Ddownload

OR: (but see only as diagram, because google drive caches images)
https://drive.google.com/file/d/15XmuINoOT5RfVd5xvlK1EuHchphPYOdG/view?usp=sharing
https://app.diagrams.net/#G15XmuINoOT5RfVd5xvlK1EuHchphPYOdG
---------------
---------------
# Config

Комманды для Бизнес-кейса делим на stages, 
каждый stage - это функция, которая может быть выполнена любым воркером в любое время,

так же - при падении на каком-то этапе - можно продолжить с этого этапа благодаря очередям (innerQ, serviceQ)!

**see**: `/src/businessCases/cases/businessCase1`

---------------
---------------
# Queues
`serviceQ` - для общения с Service \
`innerQ` - для выполнения следуйщих stage при окончании stage без реквеста на service.

настроить неудаление обработанных месседжей некоторое(необходимое) время

Предполагается использвоание `MQ` или альтернативы - у которой есть внутренние настройки перезапуска обработчика а также отложенное удаление сообщений
*везде где дальше есть `rabbitMQ` - менять на `MQ`, так как у `RabbitMQ` нет отложенного удаления сообщений
(если он не отвечает какое-то количество времени).

----------------
---------------

# Process


### Store
Для процесса - создается запись в базе - в которой хранятся все результаты выполнения stages,
а так же куда можно записывать любые данные в любом месте и в любом месте иметь к ним доступ.

Так же - статус и результат процесса server отдает клиенту отсюда

###Stages

при попадании message из innerQ или из serviceQ
начинается выполнение следуйщего stage

предидущий результат сохраняется в store (если не выставлен флаг не сохранять в конфиге)

могут выполняться в разных процессах (workers, containers, etc)

**UPDATE:** 
При старте stage - проверяется - есть ли уже сообщение с taskId стейджа в очередях (в innerQ и serviceQ) -
если есть - процесс заканчивается, message помечается как выполненный
(это значит что этот stage уже был завершен ранее, но подтверждение в очередь этого не пришло)

--------
если stage заканчивается запросом на сервис -
то в taskId зашифровываются следуйщие данные:
* processId
* businessCaseName
* businessCaseApi
* stageName

Благодаря чему, при получения сообщения из сервиса `serviceQ`
consumer получает taskId, расшифровывает его и запускает следуйщий stage

--------

если stage заканчивается без вызова функции сервиса или нужно
перейти на следуйщий stage: можно вызвать комманду: `next()`

При этом - создаетя message в `innerQ`
что нужно выполнить следуйщий `stage`

**P.S - можно добавить одну из опций передаваемую в next({...}) - указание название следуйщего stage для выполнения**

--------
--------

###Blue-Green Deployment
При deploy - вначале запускаются новые контейнеры 
а потом только выключаюются старые

если добавляется новая `api` для любого `businessCase`

то между клиентом и этим сервисом (httpServer) должен быть`API  Gateway` который будет знать - для какого API на какой из
httpServer отсылать запрос

--------
--------
###THE MAIN ASYNC PROBLEM:

главная проблема в том - что любая операция может выполняться сколько угодно раз -
так как процесс может зависнуть

статусы не помогают

к примеру:

(pseudo-code)
(под service.command() - имеется ввиду выполнения асинхронного запроса на другой сервис)
```Case1:
Case1:

markProcessAsStarted()
//здесь падает процесс (например выключилось электричество) (hard kill process)
service.command()
markProcessAsFinished();

Процесс пометился как начатый - но данные на сервис не отправились
```

```Case2:
Case2:

markProcessAsStarted()
service.command()
//здесь падает процесс (например выключилось электричество) (hard kill process)
markProcessAsFinished();

Процесс пометился как начатый - но данные на сервис уже отправились
а процесс не помечен как законченный, в итоге после перезапуска мы снова отправим на сервис
команду 
```

```Case3
Case3
Транзакционность не помогает
transaction(() => {
    markProcessAsStarted()
    service.command()
    //здесь падает процесс (например выключилось электричество) (hard kill process)
    markProcessAsFinished();
});

транзацакция откатится ( в итоге процесс перезапустится )
а данные на сервис уже отправились
```

Решить данную проблему можно стороне сервиса который делает применения changes в базе с помощью транзакции

```Case 4
Case4 (может немного отличаться)
await transaction((message) => {
    if (alreadyExistedTransaction(message.id)) {
        markMessageAsProcessed();
        return;
    }
    doCommand(message)
});
//если здесь падает сервис - процесс просто перезапустится и закончится в строке номер 50
markMessageAsResolved();
```

**UPDATE:** Либо не удалять messages после их завершения и перед отправкой нового message - смотреть - было ли уже отправлено это собщение
(реализовано)

внутри моего сервиса я для каждой комманды отправленной на сервис создаю taskId
который является засериализованной строкой в которой хранятся:
* processId
* businessCaseName
* businessCaseApi
* stageName

благодаря тому что taskId который отправлется на service всегда один и тот же для одной и той же комманды

и service для критических данных должен реализовывать решение этой проблемы, которое я описал в Case4


-----------
-----------
Что я бы улучшил в фреймворке?

можно добавить одну из опций передаваемую в next({...}) - указание название следуйщего stage для выполнения**
и еще некоторые опции я сохранил как TODO

check some error handlers

**UPDATE:**  не удалять messages после их завершения из rabbitMQ (можно настроить время хранения)

При старте stage - проверяется - есть ли уже сообщение с taskId стейджа в очередях (в innerQ и serviceQ) - 
если service удаляет месседжи после завершения - добавить ServiceApiGatewayQ и запросы делать через него, 
gateway не будет пропускать повторные messages
