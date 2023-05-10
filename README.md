# organize-md

Builds your markdown folder structure to be ready for static deployment.

It takes a JSON configuration file as an argument. Reads the contents of a specified directory, processes
markdown files and images, and outputs the modified markdown files and images to specified output directories. The
script also generates a `meta.json` file containing metadata about the processed markdown files.

#### Input structure:

```
content
├── android
│   ├── googleplay.svg
│   ├── index.md
│   └── share.jpg
├── ios
│   ├── appstore.svg
│   ├── gallery.jpeg
│   ├── index.md
│   ├── settings.jpeg
│   └── share.jpg
├── publishing
│   ├── index.md
│   ├── itunes.png
│   ├── rsscopy.png
│   └── spotify.png
└── tutorial
    └── index.md
```

```sh
touch config.js
```

```json
{
  "contentDir": "content/",
  "mdOutDir": "public/guides/",
  "imgOutDir": "public/images/guides/",
  "imgURLPrefix": "/images/guides/"
}
```

```sh
yarn add organize-md

yarn organize-md config.json
```

#### Output structure:

```
public/guides
├── android.md
├── ios.md
├── meta.json
├── publishing.md
└── tutorial.md

public/images/guides
├── android
│   ├── googleplay-b761f3.svg
│   └── share-58f774.jpg
├── ios
│   ├── appstore-b60244.svg
│   ├── gallery-aca28c.jpeg
│   ├── settings-f10556.jpeg
│   └── share-60e923.jpg
└── publishing
    ├── itunes-f1bf0c.png
    ├── rsscopy-0f6e3f.png
    └── spotify-ba1398.png
```
