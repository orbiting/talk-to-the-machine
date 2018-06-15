import React from 'react'

import { renderMdast } from 'mdast-react-render'
import { parse } from '@orbiting/remark-preset'
import createSchema from '@project-r/styleguide/lib/templates/Article'

const schema = createSchema()

const markdown = `
<section><h6>TITLE</h6>

# Löcher im Karton

Der Siegeszug des Computers hat viele Gründe. Einer davon: Es ist uns gelungen, Maschinen unsere Wünsche mitzuteilen. Wie funktioniert das? Und was hat ein Franzose aus dem 19. Jahrhundert damit zu tun? Teil I unserer Reise durch die Welt der Computer. 

Von [Thomas Preusse](/~57ff6996-e3ef-4186-a2e6-95376f2b086b), [Hanna Wick](/~ca3b87e7-84a5-43a7-979f-0cfbb9846f6d "Hanna Wick"), XXXXXXXXXXX.06.2018

<hr /></section>

<section><h6>CENTER</h6>

(...)

Kann man das nicht verhindern? Das fragt sich Jacquard schon als junger Mann. Jahrzehntelang sucht er überall nach Inspiration, schnappt da einen Trick auf, klaut dort eine Idee – und kämpft ganz nebenbei noch in der Revolutionsarmee. Schliesslich hat er alle Komponenten zusammen für den Bau des halb automatischen Webstuhls, der bis heute seinen Namen trägt. Jacquard, der Meisteringenieur, Jacquard, der Steve Jobs des 19. Jahrhunderts.

<section><h6>DYNAMIC_COMPONENT</h6>

\`\`\`
{
  "src": "/build/part1.js"
}
\`\`\`

\`\`\`html
<div>Test</div>
\`\`\`

<hr /></section>

Das Jacquard-Prinzip erweist sich als disruptiv, wie man das heute nennen würde. Das heisst: Es pflügt die ganze Industrie um. Man kann die Lochkarten (und damit die Muster) auswechseln, von einem Webstuhl zum anderen tragen, man kann sie kopieren, man kann sie klauen. Stoffdesign als Piratenware. Und vor allem: Der neue Webstuhl spart Kosten und Personal.

<hr /></section>

`

export default () => renderMdast(parse(markdown), schema)
