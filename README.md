# Microfrontend sample structure

This project shows, how a microfrontend structure might be used 
by asynchronously loading pages via a small wrapper script. The
project contains three vue3 apps where `container` consists of the
"main" project which loads other apps. `diceroll` and `wisdom` are
two other vue3 apps. All 3 are created via the vue3 npm init script 
(as suggested by the official vue tutorial).

This is heavily inspired by https://blog.bitsrc.io/how-to-develop-microfrontends-using-react-step-by-step-guide-47ebb479cacd

## Adaptions
After generating the skeletons the boilerplate code has been removed
some things have been altered in the `diceroll` and `wisdom` (apps) and
in the container part.

### Vite config adaptions in the apps
The vite config has been adapted so that the build creates a manifest

```js
build: {
    manifest: true,
    rollupOptions: {
      // overwrite default .html entry
      input: 'src/main.js'
    }
  }
```
This enables creating a manifest json file during the build which gives
us hints to the actual js classes. The bundler creates files
with a hash in its name, so that the browser knows when to reload the
file. This is in general good but comes with the challenge that each build 
has a different name. We could just make the name static, this would
then come with the problem that the browser might cache the old file.
The manifest will therefor help us to know what is the latest version.

On the `wisdom` project I had to disable the minify as I had name
conflicts with some consts in the global scope. I could not find out
what causes this but at least for now disabling `minify` solves it.

### `manifest.json` for dev mode in the apps
The manifest file only is there only in the build. For developing though
we need to have a local file too which we can use in the container to point
to. I therefore copied the `manifest.json` and point it to the static
local files. 

```json
{
  "src/main.js": {
    "file": "src/main.js",
    "src": "src/main.js",
    "isEntry": true,
    "css": [
      "src/main.css"
    ]
  },
  "src/main.css": {
    "file": "src/main.css",
    "src": "src/main.css"
  }
}
```


### Adapt the `main.js` file in the apps
I have adapted the `main.js` file
Originally it looks like this:
```js
createApp(App).mount('#app')
```

The app will always be mounted on the html element with the id `#app`.
This brings us in troubles, if we have multiple apps to load. A fixed
id per app might be a workaround, but might block us on certain use
cases.

Combined with the script that we will introduce in the container app,
this function will be rather wrapped in a global function on the window
object. This obviously comes with the potential issue on name conflicts,
so use something which makes sense for your structure.
In this case it comes with the convention `render`+ `appname` (`wisdom`)
```js
window.renderwisdom = (containerId) => {
    createApp(App).mount(containerId)
};
```


### Adapt the `index.html` in the apps
The `index.html` file was also slightly changed
Instead of just loading the script we now need to load the 
function after the page has loaded.

I have added to `index.html:
```js
window.addEventListener('load', function () {
    renderwisdom('#app')
});
```


### Adapt the container add the `MicroFrontend.vue` file
The `MicroFrontend.vue` file contains the component which loads the 
other vue microfrontends:

```js
<template>
    <div :id="this.containerName()" />
</template>

<script>
    //utility function to generate a uuid (I didn't wanted to import the uuid
    //lib just for a random string
    function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

    export default {
    name: "MicroFrontend",
    props: {
    // name of the microfrontend like `wisdom` or `dicreoll`
    name: {
    type: String,
    required: true
},
    // host where the script should be loaded from
    host: {
    type: String,
    required: true
},
    // define a static container name rather than a generic one
    // not needed if you are ok with random divs all the time
    staticContainerName: {
    type: String,
    required: false,
    default: null
}
},
    data: function () {
    return {
    uuid: uuidv4()
}
},
    methods: {
    // calculates the container id we load the microfrontend app into
    containerName() {
    if(this.staticContainerName != null) {
    return this.staticContainerName;
}
    return `${ this.name }-${this.uuid}-container`;
}
},
    mounted() {//
    // id is generated by frontend - this will avoid loading the same
    // script twice
    const scriptId = `micro-frontend-script-${this.name}`;
    const renderMicroFrontend = () => {
    const fnName = `render${this.name}`;
    const containerName = `#${this.containerName()}`;
    console.log(fnName);
    //load the render function per convention and handover the container id
    window[fnName](containerName);
};
    if (document.getElementById(scriptId)) {
    renderMicroFrontend();
    return;
}
    //first load the manifest.json this contains the way forward
    fetch(`${this.host}/manifest.json`)
    .then((res) => res.json())
    .then((manifest) => {
    const script = document.createElement("script");
    script.id = scriptId;
    //TODO: we probably should remove this if not in dev mode
    // if you run it with the local dev servers you need it though
    script.type = "module";
    script.crossOrigin = "";
    //load out the path to the main.js file
    script.src = `${this.host}/${manifest["src/main.js"]["file"]}`;
    script.onload = () => {
    // call the function defined on top which will resolve then the app
    renderMicroFrontend();
};
    document.head.appendChild(script);
});
}
};
</script>

<style scoped>

</style>
```

## Test it
I have used nodeenv locally but you just need a npm installed.
Go to each directory `container`, `wisdom` and `diceroll` and
call `npm run dev`. The `container` app might be adapted based
on the ports chosen by the `npm` script (in the `App.vue` file of the
container directory).


## Open topics
* Improve the script so we can handle local dev and prod (maybe based on the manifest structure?)
* Explore if this could also load e.g. a `ReactApp` maybe with a second component
* Implement something in diceroll (not just static content)
