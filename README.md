# Live sportscaster

This is a quick prototype of a web app that in real-time:
1. Uses OpenAI's gpt-4-vision-preview model to analyze the camera image
2. Then generates audible narration for it by using ElevenLabs text-to-speech streaming API

[![IMAGE ALT TEXT](http://img.youtube.com/vi/O53XGnRlXNI/0.jpg)](https://www.youtube.com/watch?v=O53XGnRlXNI "Generative AI image recognition and voice broadcast generation")

https://www.youtube.com/watch?v=O53XGnRlXNI

## Test right now

App is running on https://pyppe.github.io/live-sportscaster/

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list
