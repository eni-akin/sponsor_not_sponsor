"""Cross-language parity tests for Laya V2 canonical state serialization and context derivation."""
import json
import subprocess
import unittest
from pathlib import Path

from server.laya_worker import derive_neighbor, make_canonical_state

ROOT = Path(__file__).resolve().parents[1]


class V2ParityTests(unittest.TestCase):
    def test_canonical_state_keys_and_compact_separators(self):
        state = {
            "job_title": "Software Engineer",
            "employer": "Acme Corp",
            "country": "United States",
            "previous_status": "present",
            "previous": "Qualifications",
            "TARGET": "Visa sponsorship available.",
            "next": None,
            "next_status": "boundary",
        }
        serialized = json.dumps(state, ensure_ascii=False, separators=(',', ':'))
        expected = '{"job_title":"Software Engineer","employer":"Acme Corp","country":"United States","previous_status":"present","previous":"Qualifications","TARGET":"Visa sponsorship available.","next":null,"next_status":"boundary"}'
        self.assertEqual(serialized, expected)

    def test_unicode_preservation_without_ascii_escaping(self):
        state = {
            "job_title": "Ingénieur Logiciel — École",
            "employer": "Société Générale",
            "country": None,
            "previous_status": "boundary",
            "previous": None,
            "TARGET": "Éligibilité au visa: Non sponsorisé. 🌟",
            "next": None,
            "next_status": "missing",
        }
        serialized = json.dumps(state, ensure_ascii=False, separators=(',', ':'))
        self.assertIn("Ingénieur Logiciel — École", serialized)
        self.assertIn("Société Générale", serialized)
        self.assertIn("🌟", serialized)
        self.assertNotIn("\\u", serialized)

    def test_node_typescript_serialization_byte_identity(self):
        """Invoke Node to run serializeCanonicalState on diverse test vectors and verify byte-for-byte identity."""
        test_states = [
            {
                "job_title": "Staff Intern",
                "employer": "TechCo",
                "country": "US",
                "previous_status": "present",
                "previous": "Header text",
                "TARGET": "Sponsorship is available for this vacancy.",
                "next": "Footer text",
                "next_status": "present",
            },
            {
                "job_title": "Analyst (Études & Données)",
                "employer": None,
                "country": None,
                "previous_status": "boundary",
                "previous": None,
                "TARGET": "We cannot sponsor CPT/OPT applicants. “Quoted text” & symbols: <>&'\"✓",
                "next": None,
                "next_status": "missing",
            },
        ]

        output = subprocess.check_output(
            ["node", "--import", "tsx", "--input-type=module", "-e",
             "import fs from 'node:fs';import {serializeCanonicalState} from './src/decision.ts';"
             "console.log(JSON.stringify(JSON.parse(fs.readFileSync(0,'utf8')).map(serializeCanonicalState)));"],
            cwd=ROOT, input=json.dumps(test_states, ensure_ascii=False), text=True,
        )
        actual = json.loads(output)
        expected = [json.dumps(state, ensure_ascii=False, separators=(',', ':')) for state in test_states]
        self.assertEqual(actual, expected)

    def test_derive_neighbor_boundary_and_present(self):
        req = {
            "title": "Engineer",
            "contextGroups": [
                {"id": "g1", "firstPosition": 0, "lastPosition": 2, "start": "boundary", "end": "missing"}
            ],
            "blocks": [
                {"id": "b0", "contextGroup": "g1", "position": 0, "text": "Intro"},
                {"id": "b1", "contextGroup": "g1", "position": 1, "text": "Body"},
                {"id": "b2", "contextGroup": "g1", "position": 2, "text": "Conclusion"},
            ]
        }

        # b0: prev is at firstPosition -> group.start ("boundary")
        prev0 = derive_neighbor(req, req["blocks"][0], -1)
        self.assertEqual(prev0, {"status": "boundary", "position": None, "text": None})

        # b0: next is b1 -> present
        next0 = derive_neighbor(req, req["blocks"][0], 1)
        self.assertEqual(next0, {"status": "present", "position": 1, "text": "Body"})

        # b1: prev is b0 -> present
        prev1 = derive_neighbor(req, req["blocks"][1], -1)
        self.assertEqual(prev1, {"status": "present", "position": 0, "text": "Intro"})

        # b2: next is at lastPosition -> group.end ("missing")
        next2 = derive_neighbor(req, req["blocks"][2], 1)
        self.assertEqual(next2, {"status": "missing", "position": None, "text": None})

    def test_derive_neighbor_internal_gap_is_missing(self):
        req = {
            "title": "Engineer",
            "contextGroups": [
                {"id": "g1", "firstPosition": 0, "lastPosition": 5, "start": "boundary", "end": "boundary"}
            ],
            "blocks": [
                {"id": "b0", "contextGroup": "g1", "position": 0, "text": "Intro"},
                # gap at position 1
                {"id": "b2", "contextGroup": "g1", "position": 2, "text": "Target"},
            ]
        }
        # b2: pos 2, delta -1 -> looking for pos 1 which doesn't exist -> gap inside group -> missing
        prev2 = derive_neighbor(req, req["blocks"][1], -1)
        self.assertEqual(prev2, {"status": "missing", "position": None, "text": None})

    def test_make_canonical_state_structure(self):
        req = {
            "title": "Data Scientist",
            "employer": "DeepMind",
            "country": "United States",
        }
        block = {"text": "Role description"}
        prev = {"status": "present", "text": "Previous block"}
        next_n = {"status": "boundary", "text": None}

        state = make_canonical_state(req, block, prev, next_n)
        expected_keys = ["job_title", "employer", "country", "previous_status", "previous", "TARGET", "next", "next_status"]
        self.assertEqual(list(state.keys()), expected_keys)
        self.assertEqual(state["job_title"], "Data Scientist")
        self.assertEqual(state["employer"], "DeepMind")
        self.assertEqual(state["country"], "United States")
        self.assertEqual(state["previous_status"], "present")
        self.assertEqual(state["previous"], "Previous block")
        self.assertEqual(state["TARGET"], "Role description")
        self.assertIsNone(state["next"])
        self.assertEqual(state["next_status"], "boundary")


if __name__ == "__main__":
    unittest.main()
