# hanko-client

This package utilizes the [Hanko API](https://github.com/teamhanko/hanko/blob/main/backend/README.md) to provide basic
functionality that allows an easier UI integration. It is meant for use in browsers only.

## Installation

```shell
# npm
npm install @teamhanko/hanko-client

# yarn
yarn add @teamhanko/hanko-client

# pnpm
pnpm install @teamhanko/hanko-client
```

## Usage

Import as a module:

```typescript
import { Hanko } from "@teamhanko/hanko-client"
```

With a script tag via CDN:

```html
<script type="module" src="https://unpkg.com/@teamhanko/hanko-client/dist/client.js">
```

## Documentation

To see documentation, please click [here](https://todo.todo).

## Examples

### Get the current user

```typescript
const hanko = new Hanko("http://localhost:3000");

hanko.user.getCurrent().then((user) => {
    console.info("user is logged in", user);
}).catch((e) => {
    if (e instanceof UnauthorizedError) {
        console.error("user is not logged in", e);
    } else {
        console.error("something went wrong", e);
    }
})
```

### Register a WebAuthN credential

```typescript
const hanko = new Hanko("http://localhost:3000");

// You can check with `hanko.webauthn.support.isUserVerifyingPlatformAuthenticatorAvailable()`
// whether a plaftorm authenticator is available beforehand, so you can avoid errors.

hanko.webauthn.register().then(() => {
    console.info("credential registered!")
})
.catch((e) => {
    console.error(e)
})
```
