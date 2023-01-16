server, innerTaskConsumer, serviceTaskConsumer are scalable
innerQ, serviceQ should be Queue with options: rerun dead workers 
(if some worker have not respond for X second)

so, the main problem is (see README2.md)


how to make blue-green deployment
(run )

add new api Version to api versions store (db or some service), connect 
add api gateway with mapping business cases api to this service versions
and proxy request to needed server

