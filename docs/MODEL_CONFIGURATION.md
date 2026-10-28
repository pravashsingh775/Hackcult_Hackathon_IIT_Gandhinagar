# Model classes and configuration

## Current model

The backend loads Ultralytics YOLO weights from `software/yolov8n.pt` by default. The weight file is not committed; Ultralytics may fetch the standard YOLOv8n weights on first startup. The configured animal labels are defined in `software/backend/config.py` and currently include common COCO labels such as `bird`, `cow`, and `elephant`. Labels absent from the model cannot be detected.

The current configuration uses:

- `confidence_threshold`: minimum confidence for policy evaluation (default `0.50`)
- `cooldown_seconds`: minimum time between authorized deterrence requests (default `6.0`)
- `supported_animal_classes`: class names eligible for the animal-response branch

The API can update these settings at runtime through `POST /api/config`; the update is not persisted across restarts. To change the defaults for a local experiment, edit the `Settings` defaults in `software/backend/config.py` and document the exact model and class list used.

## Custom wildlife classes

The default COCO model does not provide reliable dedicated classes for every local crop-raiding species. Adding a name to `supported_animal_classes` is not training: the loaded model must actually recognize that label.

For a custom detector:

1. Obtain or build a correctly licensed dataset with representative images and bounding-box labels.
2. Split training and held-out evaluation data before training; avoid evaluating on training images.
3. Train a compatible Ultralytics detector and report per-class precision/recall on the held-out set.
4. Set the backend model path to the trained weights and configure supported labels to exactly match `model.names`.
5. Test human-only and mixed scenes with hardware disabled before any physical deployment.

No custom wildlife dataset or trained custom weights are included in this repository. Do not claim custom species coverage or overall accuracy based on a class name or one sample image.
