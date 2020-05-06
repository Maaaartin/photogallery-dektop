# Electron Compile with Typescript + SASS that makes a working installer using electron-builder


Dev
```
yarn start
```

Build to a folder
```
yarn pre-pack
yarn package
```

Build to an installer
```
yarn pre-pack
yarn dist
```


## Notes
Only tested on windows.

The package.json has:
```
  "build": {
    "electronCompile": false
  }
```
We do this build step manually.
Looks like electon-builder is messing up something when it tries to do the electron compile step.

You need to remove the `.cache` dir before `yarn start` will work. `yarn pre-pack` generates this folder.