# Surreal-Bridge

Surreal-Bridge is a lightweight, flexible Object-Relational Mapping (ORM) wrapper for SurrealDB. It simplifies the interaction between your application and SurrealDB by providing an easy-to-use interface for database operations, enabling developers to work with databases in an object-oriented way.

## Features

- **Simple API:** Intuitive and easy-to-use API for performing common database operations.
- **Schema Management:** Automatically map your classes to SurrealDB schemas.
- **Query Builder:** Powerful query-building capabilities for complex queries.
- **Flexible Relationships:** Support for one-to-one, one-to-many, and many-to-many relationships.
- **Migrations:** Tools to manage and apply database schema changes.

## Installation

You can install Surreal-Bridge via npm:

```bash
npm install surreal-bridge
```

## Getting Started

### Initialize the ORM

First, you need to configure and initialize the ORM with your SurrealDB instance:

```typescript
import { SurrealBridge } from 'surreal-bridge';

const bridge = new SurrealBridge({
    host: 'localhost',
    port: 8000,
    database: 'mydb',
		namespace: 'myapp',
    user: 'admin',
    password: 'password',
});

await bridge.connect();
```

### Define a Model

Define a model by extending the `Model` class provided by Surreal-Bridge:

```typescript
import { Model, string, number } from 'surreal-bridge';

const user = table("users", {
	name: string(),
	email: string().assert().raw("string::is::email($value)")
}).build();

const user = await user.create({ name: 'John Doe', email: 'john@example.com' });
```

### Perform Queries

You can perform CRUD operations and build queries easily:

```typescript
// Fetch a user by ID
const user = await user.findFirst({
	name: "John Doe"
});

// Update a user
await user.update({
	name: "Jane Doe"
});

// Delete a user
await user.delete();
```

## Documentation

For more detailed documentation and advanced usage, please visit our [documentation page](https://neopathways.de/products/surreal-bridge/docs).

## Contributing

We welcome contributions! If you would like to contribute to Surreal-Bridge, please read our [contributing guidelines](CONTRIBUTING.md).

## License

Surreal-Bridge is licensed under the [MIT License](LICENSE.md). See the LICENSE file for more information.