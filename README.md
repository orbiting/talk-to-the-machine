### Develop

```bash
npm run dev
open http://localhost:3000/1
open http://localhost:3000/2
open http://localhost:3000/3
```

This assumes you have an «Articles» dir two levels above, e.g. `~/Code/talk-to-the-machine` and `~/Articles/article-talk-to-the-machine-1`.

### Text

https://docs.google.com/spreadsheets/d/1FFbrwSf7hiRSwh9t4ORWIxN2SQRx-gUZkL62C-6wdGU/edit#gid=0

```bash
npm run translations
```

### Deploy

```bash
npm run build
npm run deploy
```

### Clear CDN

Goto https://app.keycdn.com/zones/purgeurl/87880 and enter:

```
/s3/republik-assets/dynamic-components/talk-to-the-machine/part2.js
/s3/republik-assets/dynamic-components/talk-to-the-machine/part1.js
/s3/republik-assets/dynamic-components/talk-to-the-machine/part3.js
```

If you change asset files (like babel.min.js, tf.min.js, model and test data) be sure to purge those too.
