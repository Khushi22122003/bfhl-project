# BFHL Frontend

## Setup
```bash
yarn install
# create .env from .env.example
echo "REACT_APP_BACKEND_URL=https://your-bfhl-backend.herokuapp.com" > .env
yarn start          # dev
yarn build          # production build in ./build
```

## Endpoint used
The app calls `${REACT_APP_BACKEND_URL}/bfhl` in production.
(Inside Emergent preview it uses `/api/bfhl` — see App.js if you want to switch.)
