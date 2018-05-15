# Log Pruning in Distributed Event-sourced Systems

[![DOI](https://img.shields.io/badge/doi-10.1145/3210284.3219767-blue.svg)](https://doi.org/10.1145/3210284.3219767) [![GitHub license](https://img.shields.io/github/license/vs-uulm/debs2018-log-pruning-evaluation.svg)](https://github.com/vs-uulm/debs2018-log-pruning-evaluation/blob/master/LICENSE)

Benjamin Erb, Dominik Meißner, Ferdinand Ogger, and Frank Kargl. 2018. Poster: Log Pruning in Distributed Event-sourced Systems. In DEBS '18: The 12th ACM International Conference on Distributed and Event-based Systems, June 25--29, 2018, Hamilton, New Zealand. ACM, New York, NY, USA, 4 pages. https://doi.org/10.1145/3210284.3219767

This repository contains source code artifacts, experiments, and results.

## Getting Started
The experiments in this repository follow the Popper convention.
The only dependencies that are necessary to replicate results or re-generate the graphics are the [Popper CLI tool](http://popper.readthedocs.io/en/latest/protocol/getting_started.html#quickstart-guide) and [Docker](https://www.docker.com/community-edition).
Assuming both Docker and the Popper CLI tool are installed, it is sufficient to execute the following command in the `pipelines/pruning` directory:
```sh
popper run
```
In case the Popper CLI tool is not available, the individual experiment stages can be executed manually:
```sh
./setup.sh
./run.sh
./post-run.sh
./teardown.sh
```

Quick description of the individual stages:

 * `setup.sh`. Generates the workloads for the 2nd stage.
 * `run.sh`. Invokes all log pruning approaches and prepares data for the analysis step.
 * `post-run.sh`. Executes the analysis and generates the graphics.
 * `teardown.sh`. Removes workloads and intermediate data.

## Evaluation Scenario Description

The evaluation is based on the synthetic model of a microservice architecture that handles external requests. Each request is routed to request-handling services and causes interactions between the services within the architecture. In general, the architecture follows a scatter/gather pattern: A request handling service calls a number of backend services. Upon receiving all replies, the request handler generates and dispatches the final response to the original request.

![Synthetic Microservice Architecture](./architecture.png?raw=true "Synthetic Microservice Architecture")

Each microservice (backed by an event-sourced actor) maintains an individual event log of incoming command messages and associated state changing events.

A given sequence of external requests hence yields corresponding event logs for all actors for the architecture. These logs provide the basis for the evaluation of the pruning approaches.


### Request Types

The workload conists of four different request types with varying impact of the involved backend services. The mix of these requests is an important characteristic of a workload.

 * *read-heavy* requests: Requests that primarily require states to be pulled from different backend services.
 * *read-write* requests: Requests that involve reading and writing of states in the backend services.
 * *compute-heavy* requests: Requests that primarily require computational operations in the backend
 * *compute-write* requests: Requests that execute computations in the backend, but also persist the results

Furthermore, a workload definition provides interaction probabilities for each request type. These parameters are used to randomly select actual backend services for each individual request during the generation of the logs.


### Microservice Types

Microservice instance types are divided into load balancers, request handlers, and backend services. The first two types only operate with very limited state while the backend services can keep significant amounts of state.

 * *Load Balancer*: uses a strategy to forward requests to a request handler, e.g., by using a round-robin strategy.
 * *Request Handlers*: For request handling, these instances dispatch commmands to backend services and eventually generate a response. Type and number of the services to interact with result from the request type and the workload definition
 * *Backend Services*: Backend services are further divided into specific types:
      * *Computing Services*: Execute computations with limited amount of states for the event logs (e.g., validation services)
      * *Storage Services*: These services maintain and update application states (e.g., session handling, caching, ...)
      * *Logging Services*: Append application-level data to a log: Note that this is not directly related to the event log or the event sourcing approach, as the logging servives are part of the application, not the underlying runtime (e.g., request logging)
