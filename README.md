UPDATE!:

# Diagram: 

**OPEN IN** `draw.io` application!!!!!!!!!!!! (on site)

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

Предполагается использвоание `RabbitMQ` или альтернативы - у которой есть внутренние настройки перезапуска обработчика
(если он не отвечает какое-то количество времени).

----------------
---------------

# Process


### Store
Для процесса - создается запись в базе - в которой хранятся все результаты выполнения stages,
а так же куда можно записывать любые данные в любом месте и в любом месте иметь к ним доступ.

Так же - статус и результат процесса server отдает клиенту отсюда

###Stages

могут выполняться в разных процессах (workers, containers, etc)

TODO: При старте stage - проверять - есть ли уже сообщение с taskId стейджа в очередях (в innerQ и serviceQ) - если есть - заканчивать процесс и не переходить к выполнению stage

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

*UPDATE:* Либо не удалять messages после их завершения и перед отправкой нового message - смотреть - было ли уже отправлено это собщение


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

*UPDATE:* не удалять messages после их завершения из rabbitMQ (можно настроить время хранения)

При старте stage - проверять - есть ли уже сообщение с taskId стейджа в очередях (в innerQ и serviceQ) - если service удаляет месседжи после завершения - добавить ServiceApiGatewayQ который не будет пропускать повторые messages
