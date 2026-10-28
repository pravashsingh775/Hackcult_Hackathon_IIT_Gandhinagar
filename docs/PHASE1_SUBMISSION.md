# HackCult '26 Phase 1 submission checklist

## Deliverables

- [x] Code repository prepared locally from the committed project baseline.
- [x] Project-specific README with run and setup instructions.
- [x] Architecture diagram, current event data model, and clearly labeled proposed database design in [ARCHITECTURE.md](ARCHITECTURE.md).
- [x] Pitch deck included at [HackCult26-Smart-Bijuka-Pitch-Deck.pptx](HackCult26-Smart-Bijuka-Pitch-Deck.pptx).
- [x] Create and publish the repository as a public GitHub repository: [Hackcult_Hackathon_IIT_Gandhinagar](https://github.com/pravashsingh775/Hackcult_Hackathon_IIT_Gandhinagar).
- [ ] Record and upload an unlisted YouTube walkthrough.
- [x] Add the public repository URL to the pitch deck's last slide.
- [ ] Add the unlisted video URL to the pitch deck's last slide and the submission form.
- [ ] Re-check the official submission portal for the closing time; the supplied event description conflicts between 6:30 PM and 11:59 PM IST on 4 November 2026.

## Walkthrough outline

Use the running system and fresh, non-sensitive inputs. Do not use a scripted screenshot as proof of live detection.

1. Show the hardware prototype and identify which components are assembled versus still being integrated.
2. Start the FastAPI backend and show `/api/status` and the interactive `/docs`.
3. Submit an actual animal image to `/api/detect/image`; show the class, confidence, annotated output, and decision.
4. Submit a person-only image and a mixed person-and-animal image; show that confident human presence suppresses deterrence in both cases.
5. Show a low-confidence or unsupported class and the cooldown behavior, if the test data demonstrates them.
6. Show the event record and the CSV persistence. Explain that this is local storage, not a cloud database.
7. Show that actuator mode is simulation by default. Only demonstrate physical actuation if the wiring and safety checks have been completed.
8. State limitations: sample-image confidence is not model accuracy; end-to-end field integration, solar runtime, and field-effectiveness measurements remain pending.

## Before recording

- Use a clean test dataset or images you have permission to show.
- Do not show credentials, private network details, unrelated personal data, or another person's contact information.
- Ensure the host, camera, model, and audio are ready before starting the capture.
- Replace the empty GitHub/demo links on the deck's final slide after both URLs exist.
