# markdown-assets

Builds your markdown with relative image paths for deployment.

### Input structure:

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
yarn add markdown-assets

yarn markdown-assets config.json
```

### Output structure:

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

## Framework configuration for optimized image loading

### Next.js

In `next.config.js` `headers()` array add this:

```js
;[
  {
    source: "/images/*",
    headers: [
      {
        key: "Cache-Control",
        value: "public, max-age=31536000, immutable",
      },
    ],
  },
]
```

Where `/images/*` matches the `imgURLPrefix` value from the config file.

[Next.js headers doc.](https://nextjs.org/docs/pages/api-reference/next-config-js/headers)

### Remix deployed to Cloudflare Pages

In `public/_headers` file add this:

```
/images/*
  Cache-Control: public, max-age=31536000, immutable
```

Where `/images/*` matches the `imgURLPrefix` value from the config file.

[Cloudflare Pages headers doc.](https://developers.cloudflare.com/pages/platform/headers/)
