---
title: Play YouTube in the background on Android
description: Using Listenbox to play YouTube as a podcast
date: 2020-11-07
---

Install Listenbox Android app:

<a href="https://play.google.com/store/apps/details?id=app.listenbox" target="_blank" rel="noreferrer">
    <img style="height: 48px; margin: 0;" src="googleplay.svg" alt="google play"/>
</a>

Now you have Listenbox in your share sheet. Tap this button and choose "Listen" from the list:

<button class="focus:outline-none h-12 w-20 rounded-md bg-white text-sm font-bold text-black duration-200 hover:shadow-dark-xl" onclick="(() => navigator.share({ title: 'Richard Feynman Interview', url: 'https://youtu.be/GNhlNSLQAFE', }))()">
    Test it
</button>

<p>
    <img width="320" src="share.jpg" alt="Share sheet" />
</p>
