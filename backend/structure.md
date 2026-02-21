## Request :

```json
{
  "character": {
    "name": "CharacterName",
    "description": "CharacterDescription",
    "tone": "ToneOfCharacter"
  },
  "material": {
    "file": "File",
    "prompt": "prompt"
  }
}
```

## Response :

```json
{
  "title": "title of the story",
  "summary": "summary of the story",
  "frames": [
    // normal frame
    {
      "id": "frameId",
      "speaker": "name of the speaker",
      "text": "text of the frame",
      "emotion": "emotion of the speaker",
      "nextFrameId": "frameId"
    },
    // question frame
    {
      "id": "frameId",
      "speaker": "name of the speaker",
      "text": "text of the frame",
      "emotion": "emotion of the speaker",
      "options": [
        {
          "text": "text of the option",
          "nextFrameId": "frameId"
        }
      ],
      "nextFrameId": "frameId"
    }
  ]
}
```
