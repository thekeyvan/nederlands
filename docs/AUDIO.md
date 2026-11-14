# Dutch audio

The site serves pre-generated MP3 files from its own `public/assets/audio/` directory (served at `/assets/audio/`). There is no paid speech service, API key, browser speech synthesis or microphone access. Both selectable voices use Dutch Netherlands models (`nl_NL`, eSpeak phonemizer `nl`). They are synthetic voices, not recordings of human speakers reading this course. Five playback speeds (0.75×, 0.85×, 1×, 1.15× and 1.25×) use the browser's pitch-preserving playback rate. The selected speed and voice are saved locally and apply to every listen button, including practice and dialogue lines.

`src/core/audio-catalog.js` maps exact Dutch text to a 24-character SHA-256 filename. Identical text shares a clip; content IDs and learning progress are independent of audio filenames. `scripts/audio-texts.mjs` collects every word, usage example, practical sentence, grammar example and dialogue line, plus the voice-comparison sample. Tests require clips for every text in both voices. Unknown text shows an audio error; it never falls back to another language.

## Regenerate after changing Dutch content

Ordinary forks only need Node to build: all audio is already included. For authors adding Dutch text, install Python 3.12+, ffmpeg and the optional generator dependencies in a separate virtual environment:

```sh
python3 -m venv ../audio-tools
../audio-tools/bin/pip install -r scripts/audio-requirements.txt
../audio-tools/bin/python scripts/generate-audio.py
npm test
npm run build
```

The tool downloads two approximately 63 MB models to `../audio-models/`, outside the public app. The download revision and SHA-256 checksums are pinned in the script. Generation is local and resumable; existing files are retained. Commit the new audio files and catalog together with content edits. If changing synthesis settings, first remove affected output files so they are regenerated. Model weights, virtual environments and WAV intermediates are not shipped to visitors. The optional Python runtime and its dependencies keep their own licenses and are not incorporated into the browser application.

## Sources and notices

Generation uses [Piper](https://github.com/OHF-Voice/piper1-gpl), version 1.8.0, with the `nl_NL-ronnie-medium` and `nl_NL-pim-medium` models. The model cards identify their training datasets and base Dutch/Flemish dataset as CC0. Copies of the source model cards are retained in [audio credits](../assets/audio/NOTICE.md). Original learning text and the generated audio are included under the project's MIT license; source model and tool notices remain separate.

Pinned model repository: [rhasspy/piper-voices, revision 6b9cfaacb4fb2e02a9621227e3c1a48bec9710c3](https://huggingface.co/rhasspy/piper-voices/tree/6b9cfaacb4fb2e02a9621227e3c1a48bec9710c3/nl/nl_NL).
