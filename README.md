## How to use the application
This is currently a in development application, in-which to run, would require the installation of a NodeJS environment. Follow the download guide at [Nodejs.org](https://nodejs.org/en/download). Then download the source repository.
Go to the config folder, and create a new file called (.env), for this to work, you'd need to have [file extensions turned on, on Windows](https://www.google.com/search?q=show+hidden+file+extensions+windows&sca_esv=393159a26b253a41&sxsrf=AHTn8zryJZja-p1VyHFR3ty0hmne5KJlYg%3A1744288275089&ei=E7r3Z_maBYy7seMPgcybyQI&ved=0ahUKEwi58JaYvM2MAxWMXWwGHQHmJikQ4dUDCBA&uact=5&oq=show+hidden+file+extensions+windows&gs_lp=Egxnd3Mtd2l6LXNlcnAiI3Nob3cgaGlkZGVuIGZpbGUgZXh0ZW5zaW9ucyB3aW5kb3dzMgoQIxiABBgnGIoFMgoQABiABBhDGIoFMgYQABgWGB4yBhAAGBYYHjILEAAYgAQYhgMYigUyCBAAGIAEGKIEMgUQABjvBTIIEAAYgAQYogRI1whQpwRY-AZwAXgBkAEAmAGtAaABsQOqAQMxLjK4AQPIAQD4AQGYAgOgArYCwgIKEAAYsAMY1gQYR5gDAIgGAZAGCJIHAzEuMqAHzRmyBwMwLjK4B6wC&sclient=gws-wiz-serp).
Then in that file, enter these following variables
```env
GROQ_API_KEY=GROQ_API_TOKEN
TOKEN=DISCORD_BOT_TOKEN
```

Replace the example variables, (aka GROQ_API_TOKEN, and DISCORD_BOT_TOKEN), with their actual tokens. For the discord bot token, go to [Discord.com](https://discord.com/developers/applications/), and create a new application. And create a discord bot, following their guide [here](https://www.google.com/search?q=how+to+make+a+discord+bot&oq=how+to+make+a+discord+bot&gs_lcrp=EgZjaHJvbWUyCQgAEEUYORiABDIHCAEQABiABDIHCAIQABiABDIHCAMQABiABDIHCAQQABiABDIHCAUQABiABDIHCAYQABiABDIHCAcQABiABDIHCAgQABiABDIHCAkQABiABNIBCDI4NjlqMGo3qAIAsAIA&sourceid=chrome&ie=UTF-8)
Then go to bots, and reset the token, and copy your bot token. Replace DISCORD_BOT_TOKEN, with your actual bot token.

And then for GROQ_API_TOKEN, go to [Groq.com](https://console.groq.com/keys) and sign up, then get your free API and replace GROQ_API_TOKEN, with the actual key you just got.
And then run ``npm install`` on the root directory, with [Command Prompt](https://www.google.com/search?q=windows+command+prompt&oq=Windows+command+&gs_lcrp=EgZjaHJvbWUqBwgAEAAYgAQyBwgAEAAYgAQyBwgBEAAYgAQyBggCEEUYOTIHCAMQABiABDIHCAQQABiABDIHCAUQABiABDIHCAYQABiABDIHCAcQABiABDIMCAgQABgUGIcCGIAEMgcICRAAGIAE0gEIMTk5MGowajmoAgCwAgE&sourceid=chrome&ie=UTF-8)
After that, run ``node .`` and then write ``discord`` in the option that should be like this:
```cmd
(node:18704) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
::discord
```
Then the bot should run.
