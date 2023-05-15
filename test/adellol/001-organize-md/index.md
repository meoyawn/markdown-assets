---
title: Organizing Markdown for Next.js and Remix Websites with the `organize-md` Script
description: Discover how to optimize content organization and improve load times on your Next.js or Remix websites using the `organize-md` script.
date: 2023-05-13
---

If you're building static sites with Markdown, like blogs or documentation sites, on Next.js or Remix, you might have
come across the issue of managing your content structure effectively. Today, I want to introduce a script that can help
you streamline your workflow: `organize-md`.

## What is `organize-md`?

`organize-md` is a TypeScript script that organizes your Markdown folder structure, making it ready for static
deployment. It reads the contents of a specified directory, processes Markdown files and images, and outputs the
modified Markdown files and images to specified output directories. In addition, it also generates a `meta.json` file
containing metadata about the processed Markdown files.

This script is handy when you have a lot of content that needs to be organized systematically, especially for large
blogs or documentation sites.

## How does it work?

The script works by taking a JSON configuration file as an argument. Here's an example of a typical input structure:

```txt
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

You would first need to create a configuration file (`config.js` or `config.json`), where you specify the directories
the script should work with:

```json
{
  "contentDir": "content/",
  "mdOutDir": "public/guides/",
  "imgOutDir": "public/images/guides/",
  "imgURLPrefix": "/images/guides/"
}
```

With the configuration file in place, you can then run the `organize-md` script:

```sh
yarn add organize-md
yarn organize-md config.json
```

The script will process the files in your content directory, hash and rename your images, and then output the organized
Markdown and image files in the directories specified in your configuration file. Here's an example of the output
structure:

```txt
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

## Optimal Image Loading in Next.js and Remix

To take full advantage of this script and leverage browser caching, you can add some configurations in your framework.

### Next.js

In `next.config.js`, add the following to your `headers()` array:

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

Where `/images/*` matches the `imgURLPrefix` value from the config file

Here, you're instructing Next.js to add a `Cache-Control` header to any HTTP responses where the requested URL matches
the pattern `/images/*`. This tells the browser to cache the images for a year (`max-age=31536000`), and that the file
will not change during this period (`immutable`).

Check the [Next.js headers documentation](https://nextjs.org/docs/pages/api-reference/next-config-js/headers) for more
details on this configuration.

### Remix (deployed to Cloudflare Pages)

If you're using Remix and deploying to Cloudflare Pages, you can set similar caching headers in your `public/_headers`
file:

```txt
/images/*
    Cache-Control: public, max-age=31536000, immutable
```

Again, make sure `/images/*` matches the `imgURLPrefix` value from the config file.

This configuration will apply the same caching policy as the Next.js example above for all images served from URLs that
match the pattern `/images/*`.

Refer to the [Cloudflare Pages headers documentation](https://developers.cloudflare.com/pages/platform/headers/) for
more information.

## Wrapping Up

By utilizing the `organize-md` script, you can streamline your content organization process, ensuring your Markdown
files and images are systematically organized and ready for static deployment. Moreover, by properly configuring your
Next.js or Remix app, you can leverage browser caching for your images, speeding up your site load times and improving
your user's experience.

Remember, efficient content management and optimal performance are key to building successful static sites. Happy
coding!
