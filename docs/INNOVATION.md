# Prototype rationale and validation plan

Smart Bijuka explores a selective, non-lethal response to crop-raiding animals. Rather than treating every motion event as a threat, the software can classify supported object labels, apply confidence and cooldown rules, and request a configurable response. The Green Energy & Sustainability fit is the intended solar-assisted field design; measured power autonomy is not yet available.

## Implemented in the software baseline

- YOLOv8 object detection with class names, confidence values, and bounding boxes.
- A configurable list of animal labels and a confidence threshold.
- A response policy that returns no deterrence for a person-only detection.
- Simulation by default, with opt-in actuator dispatch paths in the backend.
- Local annotated snapshots and CSV event records.

**Mixed detections:** the current decision code checks for a supported animal before it checks for a person. Therefore, a frame containing both a person and a supported animal can authorize deterrence. The current person-only test does not prove a blanket human-presence interlock. This behavior must be explicitly tested and resolved before claiming that any human presence always suppresses actuation.

## Design goals, not validated results

- **Reduce unnecessary reactions:** class-aware decisions are intended to avoid reacting to every movement. False-positive/negative rates have not been established in representative field conditions.
- **Reduce habituation:** varied, carefully selected non-harmful deterrents are a design direction. The included software and hardware have not established long-term behavioral effectiveness.
- **Operate in remote fields:** a solar panel and battery appear in the prototype design. Energy consumption, charging performance, and overnight runtime remain to be measured.
- **Retain event evidence:** the current backend writes local snapshots and CSV records. This is not a cloud-synchronized or durable multi-user event service.

## What should be measured next

1. Define a held-out dataset with permissioned images across relevant species, distances, lighting, and weather.
2. Report per-class precision/recall and false activations, not a single sample confidence score.
3. Test human-only and mixed human/animal scenes before enabling hardware.
4. Measure inference and end-to-end response latency on the actual deployment computer.
5. Test camera disconnects, model startup failure, and network loss.
6. Measure current draw, solar charging, battery runtime, and mechanical reliability over a documented test period.
7. Conduct controlled, ethical field studies before making crop-loss or animal-behavior claims.

Older experiment and research documents are included for context. Their quantitative claims are not reproduced by the current CI tests and should not be presented as verified HackCult results without reviewing their methods and repeating the measurements.
