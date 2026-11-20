# amr 2d — Local Animation Studio

amr 2d is a prompt-driven animation app with a lightweight procedural fallback and optional local AI video generation through ComfyUI. AI generation has no hosted-service quota or API key: prompts are sent only to ComfyUI on your own computer. Model quality, output length, and rendering speed depend on the video model, workflow, and hardware you install.

## Run it

For the procedural preview, open the hosted website or double-click `Run amr 2d.bat` / open `index.html` in a current browser. No installation is needed.

For local AI video generation, install ComfyUI and a compatible text-to-video model on your computer, then:

1. Start ComfyUI on its default local address and enable CORS for the website's exact origin (for example, `python main.py --enable-cors-header https://ahasanulsijan-netizen.github.io`).
2. Open `index.html`, choose **Connect to ComfyUI**, and load a trusted ComfyUI workflow saved in API format.

amr 2d sends requests only to ComfyUI at `127.0.0.1:8188`; it does not send prompts to an online AI service. Keep ComfyUI bound to localhost and allow only the app's exact origin in CORS.

## Use it

Load an API workflow with `{{PROMPT}}` in its positive text input, `{{FPS}}` in its frame-rate input, and either `{{DURATION_SECONDS}}` or `{{TOTAL_FRAMES}}` in its duration input. Exact placeholder values are replaced with the selected prompt, FPS, and video duration before the workflow is queued. Choose **Generate with local AI** to submit it to ComfyUI; the result appears in the built-in player and can be downloaded.

The procedural fallback recognizes rocket/spacecraft, cat/kitten, flower, bird, and ball prompts; other descriptions create a little landscape scene. Use the timeline, play button, and FPS selector to preview the looping eight-second animation. In **Motion Editor**, scrub to a time, add a keyframe, and edit its X/Y position and rotation. The scene interpolates between keyframes. Choose **Export SVG** to download a standalone animated SVG, which can be opened in a browser or edited in a vector graphics tool.

Choose **1 minute**, **3 minutes**, or **5 minutes** under **Video Length**. Local AI passes this duration to the workflow; the workflow must be designed to generate that many seconds (usually by extending or chaining clips). Video generation can take substantially longer than playback, especially on consumer hardware. The separate **Create WebM video** button records the procedural preview in real time.

Use the **+** button in the prompt box to add local image reference frames. They appear as removable thumbnails and are never uploaded or passed to the AI workflow.

No AI model is bundled. Model capability, memory use, and speed depend on the video model and workflow installed in ComfyUI; use only workflows you trust.

For a stronger model with quantized weights, the official [LTX-Video model card](https://huggingface.co/Lightricks/LTX-Video) lists distilled FP8 options: 13B favors quality while 2B is more compact with some quality trade-off. Quantization reduces model storage compared with full-precision weights, but a 13B model still needs substantially more disk and GPU memory than a 2B model.
