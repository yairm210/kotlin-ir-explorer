# Kotlin IR Explorer

![Example mermaid graph](docs/mermaid-graph-example.png)

This is a simple tool to visualize the Kotlin IR (Intermediate Representation) of a Kotlin program as a Mermaid graph.

## Development

There are 3 parts to this project:

- **core** comprises the code that converts Kotlin code to IR, and IR to a Mermaid graph
- **server** is a Ktor server that serves an endpoint for such a conversion, and a static site for code input and graph output
- **server/src/main/resources/static** is a simple React app (kudos [nano-react-app!](https://github.com/nano-react-app/nano-react-app)) that provides a UI for the server, with further documentation in its readme

To build the static site:

```shell
cd server/src/main/resources/static
npm install
npm run build
```

To run the server:

```shell
./gradlew :server:run
```
