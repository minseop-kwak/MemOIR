# Walkthrough format

A walkthrough replays one logged agent session in the live player
(`static/js/walkthrough.js` + `static/css/walkthrough.css`). Each walkthrough is a folder:

```
walkthroughs/<id>/
  walkthrough.json
  media/            images and short videos the json points to
```

Embed it with

```html
<link rel="stylesheet" href="static/css/walkthrough.css">
<div class="walkthrough" data-src="walkthroughs/<id>/walkthrough.json"></div>
<script src="static/js/walkthrough.js"></script>
```

`data-src` may list several json files separated by commas; the player then shows
prev / next buttons and dots, and moves on to the next sample when one finishes.

## walkthrough.json

```json
{
  "id": "sceneclaw-video",
  "title": "SceneClaw: driving video to a 4D code world",
  "subtitle": "Waymo Open Dataset, San Francisco, day · 199 frames at 10 fps",
  "task": "Reconstruct this driving clip as an editable 4D blocks world.",
  "inputs": [ {"src": "media/input_f000.jpg", "label": "frame 0"} ],
  "steps": [
    {"type": "plan",     "label": "Plan", "text": "...", "media": [...], "kv": [...]},
    {"type": "code",     "label": "Road from measured offsets", "code": "roadmodel.build(c4, F, spec)\n..."},
    {"type": "feedback", "label": "Check: lines on the paint?", "text": "...",
     "media": [{"src": "media/check.jpg", "label": "roadmodel.check, frames 0 / 198"}],
     "kv": [["roadmodel.build", "52 road lines / edges"]]},
    {"type": "result",   "label": "Code world", "text": "...",
     "media": [{"src": "media/result.mp4", "poster": "media/result.jpg", "label": "camera | render"}],
     "kv": [["objects", "52 vehicles"]], "code": "scene.car('veh002', ...)"}
  ]
}
```

| field | required | meaning |
|---|---|---|
| `id` | yes | folder name, lowercase with dashes |
| `title` | yes | short plain title (no slogans) |
| `subtitle` | no | data source, clip length, agent or version |
| `task` | yes | one plain sentence: what the agent was asked to do |
| `inputs` | no | 1-6 input frames or clips shown in the header, `{"src", "label"}` |
| `steps` | yes | the session, in order; about 10-16 steps reads well |

Step fields:

| field | used by | meaning |
|---|---|---|
| `type` | all | `plan`, `code`, `feedback` or `result` |
| `label` | all | short step name, shown in the progress bar and on the step |
| `text` | all (optional) | what the agent saw or decided; plain text, `` `code` `` and `**bold**` allowed, `\n` = line break |
| `code` | `code`, `result` | Python source, shown with syntax highlighting (code steps type out line by line) |
| `media` | `plan`, `feedback`, `result` | list of `{"src", "label", "poster"?}`; jpg / png / webp / mp4 |
| `kv` | `plan`, `feedback`, `result` | list of `["key", "value"]` lines (tool printouts, kernel state) |
| `duration` | all (optional) | milliseconds the step stays on screen; by default it is computed from the amount of code, text, media and kv |

Code steps are numbered automatically ("Step 3 · Code").

Paths in `src` and `poster` are relative to the json file. Videos play muted and looped while their
step is on screen; give them a `poster`. Images open full size in a new tab when clicked; images
wider than 2.2:1 take a full row.

## Rules for logging a session

- Use a real run. Take the steps from the agent's log in order; condense long cells to their
  essential lines (drop prints and bookkeeping), but never change what was run or what came out.
  Mark summaries you add yourself (for example `# ... b001 replaced by a wall`).
- Feedback media are the images the agent actually looked at, copied from the log or the run folder.
- Keep the agent's own words where possible (its `# SAW:` / `# DO:` notes, tool printouts).
- Remove anything that identifies machines or people other than the authors: no cluster paths
  (`/gpfs`, `/nfs`, home folders), user names, e-mail addresses, job ids.
- Plain, professional wording: no marketing phrases.
- Media budget: compressed jpg (about 1000-1500 px wide, quality ~80), short mp4 (H.264, yuv420p,
  `-movflags +faststart`, no audio); keep a folder under ~15 MB.
- Code lines are highlighted one line at a time: avoid multi-line string literals.
