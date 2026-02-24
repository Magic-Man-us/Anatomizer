import type { AnalysisResponse } from "./types";

export interface CodeExample {
  id: string;
  title: string;
  description: string;
  language: string;
  code: string;
  analysis: AnalysisResponse;
}

export const EXAMPLES: CodeExample[] =
[
  {
    "id": "py-threading",
    "title": "Threading & Locks",
    "description": "Race conditions, mutex patterns, and shared state",
    "language": "python",
    "code": "import threading\nimport time\n\ncounter = 0\nlock = threading.Lock()\n\ndef increment(n):\n    global counter\n    for i in range(n):\n        lock.acquire()\n        temp = counter\n        time.sleep(0.001)\n        counter = temp + 1\n        lock.release()\n\ndef fast_sum(data):\n    result_comp = sum([x * 2 for x in data])\n    result_loop = 0\n    for x in data:\n        result_loop += x * 2\n    return result_comp, result_loop\n\nt1 = threading.Thread(target=increment, args=(100,))\nt2 = threading.Thread(target=increment, args=(100,))\nt1.start()\nt2.start()\nt1.join()\nt2.join()\nprint(f\"Counter: {counter}\")",
    "analysis": {
      "language": "python",
      "execution": {
        "instructions": [
          {
            "op": "CALL",
            "detail": "call increment(n)",
            "cycles": 100
          },
          {
            "op": "LOAD",
            "detail": "load param n",
            "cycles": 1
          },
          {
            "op": "STORE",
            "detail": "store return of increment",
            "cycles": 1
          },
          {
            "op": "CALL",
            "detail": "call fast_sum(data)",
            "cycles": 100
          },
          {
            "op": "LOAD",
            "detail": "load param data",
            "cycles": 1
          },
          {
            "op": "STORE",
            "detail": "store return of fast_sum",
            "cycles": 1
          },
          {
            "op": "LOOP_START",
            "detail": "for loop ~100 iterations (lines 9-14)",
            "cycles": 8
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "CMP",
            "detail": "loop condition x100",
            "cycles": 500
          },
          {
            "op": "LOOP_END",
            "detail": "end for loop",
            "cycles": 0
          },
          {
            "op": "LOOP_START",
            "detail": "for loop ~100 iterations (lines 19-20)",
            "cycles": 8
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "CMP",
            "detail": "loop condition x100",
            "cycles": 500
          },
          {
            "op": "LOOP_END",
            "detail": "end for loop",
            "cycles": 0
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~19 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate list_comprehension (Heap) — list comprehension (size depends on input)",
            "cycles": 20
          }
        ],
        "maxCycles": 5460,
        "summary": "20 pseudo-instructions, 5460 estimated cycles (2 functions, 2 loops, 2 allocations)"
      },
      "cost": {
        "lines": [
          {
            "line": 7,
            "cost": 50,
            "label": "~50 cycles"
          },
          {
            "line": 9,
            "cost": 8,
            "label": "~8 cycles"
          },
          {
            "line": 10,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 11,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 12,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 13,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 14,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 16,
            "cost": 50,
            "label": "~50 cycles"
          },
          {
            "line": 17,
            "cost": 20,
            "label": "~20 cycles"
          },
          {
            "line": 19,
            "cost": 8,
            "label": "~8 cycles"
          },
          {
            "line": 20,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 29,
            "cost": 20,
            "label": "~20 cycles"
          }
        ],
        "maxCost": 500,
        "insights": "Line 20 is the hottest at ~500 estimated cycles. 2 function(s), 2 loop(s), 2 allocation(s) contribute to the total cost."
      },
      "memory": {
        "allocations": [
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~19 chars",
            "size": "~68 B"
          },
          {
            "type": "heap",
            "name": "list_comprehension",
            "detail": "list comprehension (size depends on input)",
            "size": "~dynamic B"
          }
        ],
        "stackTotal": "0 B",
        "heapTotal": "68 B",
        "allocCount": 2,
        "notes": "2 heap allocations totaling ~68 B Largest: string of ~19 chars (~68 B)."
      },
      "concurrency": {
        "threads": [
          {
            "name": "main",
            "events": [
              {
                "type": "lock",
                "label": "lock lock"
              },
              {
                "type": "unlock",
                "label": "unlock lock"
              },
              {
                "type": "write",
                "label": "write counter"
              },
              {
                "type": "spawn",
                "label": "thread_spawn: threading.Thread(target=increment, args=(100,))"
              },
              {
                "type": "spawn",
                "label": "thread_spawn: threading.Thread(target=increment, args=(100,))"
              }
            ]
          },
          {
            "name": "thread-0",
            "events": [
              {
                "type": "spawn",
                "label": "threading.Thread(target=increment, args=(100,))"
              }
            ]
          },
          {
            "name": "thread-1",
            "events": [
              {
                "type": "spawn",
                "label": "threading.Thread(target=increment, args=(100,))"
              }
            ]
          }
        ],
        "warnings": [
          "1 shared variable access(es) outside locked regions"
        ],
        "analysis": "1 potential issue(s) found. Review warnings."
      },
      "assembly": {
        "arch": "cpython-bytecode",
        "blocks": [
          {
            "label": "module",
            "instructions": [
              {
                "addr": "0",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "LOAD_CONST",
                "operands": "0 (0)",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "LOAD_CONST",
                "operands": "1 (None)",
                "comment": ""
              },
              {
                "addr": "6",
                "op": "IMPORT_NAME",
                "operands": "0 (threading)",
                "comment": ""
              },
              {
                "addr": "8",
                "op": "STORE_NAME",
                "operands": "0 (threading)",
                "comment": ""
              },
              {
                "addr": "10",
                "op": "LOAD_CONST",
                "operands": "0 (0)",
                "comment": ""
              },
              {
                "addr": "12",
                "op": "LOAD_CONST",
                "operands": "1 (None)",
                "comment": ""
              },
              {
                "addr": "14",
                "op": "IMPORT_NAME",
                "operands": "1 (time)",
                "comment": ""
              },
              {
                "addr": "16",
                "op": "STORE_NAME",
                "operands": "1 (time)",
                "comment": ""
              },
              {
                "addr": "18",
                "op": "LOAD_CONST",
                "operands": "0 (0)",
                "comment": ""
              },
              {
                "addr": "20",
                "op": "STORE_GLOBAL",
                "operands": "2 (counter)",
                "comment": ""
              },
              {
                "addr": "22",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "24",
                "op": "LOAD_NAME",
                "operands": "0 (threading)",
                "comment": ""
              },
              {
                "addr": "26",
                "op": "LOAD_ATTR",
                "operands": "6 (Lock)",
                "comment": ""
              },
              {
                "addr": "46",
                "op": "CALL",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "54",
                "op": "STORE_NAME",
                "operands": "4 (lock)",
                "comment": ""
              },
              {
                "addr": "56",
                "op": "LOAD_CONST",
                "operands": "2 (<code object increment at 0x72166b09ad30, file \"<input>\", line 7>)",
                "comment": ""
              },
              {
                "addr": "58",
                "op": "MAKE_FUNCTION",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "60",
                "op": "STORE_NAME",
                "operands": "5 (increment)",
                "comment": ""
              },
              {
                "addr": "62",
                "op": "LOAD_CONST",
                "operands": "3 (<code object fast_sum at 0x72166b0e3930, file \"<input>\", line 16>)",
                "comment": ""
              },
              {
                "addr": "64",
                "op": "MAKE_FUNCTION",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "66",
                "op": "STORE_NAME",
                "operands": "6 (fast_sum)",
                "comment": ""
              },
              {
                "addr": "68",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "70",
                "op": "LOAD_NAME",
                "operands": "0 (threading)",
                "comment": ""
              },
              {
                "addr": "72",
                "op": "LOAD_ATTR",
                "operands": "14 (Thread)",
                "comment": ""
              },
              {
                "addr": "92",
                "op": "LOAD_NAME",
                "operands": "5 (increment)",
                "comment": ""
              },
              {
                "addr": "94",
                "op": "LOAD_CONST",
                "operands": "4 ((100,))",
                "comment": ""
              },
              {
                "addr": "96",
                "op": "KW_NAMES",
                "operands": "5 (('target', 'args'))",
                "comment": ""
              },
              {
                "addr": "98",
                "op": "CALL",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "106",
                "op": "STORE_NAME",
                "operands": "8 (t1)",
                "comment": ""
              },
              {
                "addr": "108",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "110",
                "op": "LOAD_NAME",
                "operands": "0 (threading)",
                "comment": ""
              },
              {
                "addr": "112",
                "op": "LOAD_ATTR",
                "operands": "14 (Thread)",
                "comment": ""
              },
              {
                "addr": "132",
                "op": "LOAD_NAME",
                "operands": "5 (increment)",
                "comment": ""
              },
              {
                "addr": "134",
                "op": "LOAD_CONST",
                "operands": "4 ((100,))",
                "comment": ""
              },
              {
                "addr": "136",
                "op": "KW_NAMES",
                "operands": "5 (('target', 'args'))",
                "comment": ""
              },
              {
                "addr": "138",
                "op": "CALL",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "146",
                "op": "STORE_NAME",
                "operands": "9 (t2)",
                "comment": ""
              },
              {
                "addr": "148",
                "op": "LOAD_NAME",
                "operands": "8 (t1)",
                "comment": ""
              },
              {
                "addr": "150",
                "op": "LOAD_ATTR",
                "operands": "21 (NULL|self + start)",
                "comment": ""
              },
              {
                "addr": "170",
                "op": "CALL",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "178",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "180",
                "op": "LOAD_NAME",
                "operands": "9 (t2)",
                "comment": ""
              },
              {
                "addr": "182",
                "op": "LOAD_ATTR",
                "operands": "21 (NULL|self + start)",
                "comment": ""
              },
              {
                "addr": "202",
                "op": "CALL",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "210",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "212",
                "op": "LOAD_NAME",
                "operands": "8 (t1)",
                "comment": ""
              },
              {
                "addr": "214",
                "op": "LOAD_ATTR",
                "operands": "23 (NULL|self + join)",
                "comment": ""
              },
              {
                "addr": "234",
                "op": "CALL",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "242",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "244",
                "op": "LOAD_NAME",
                "operands": "9 (t2)",
                "comment": ""
              },
              {
                "addr": "246",
                "op": "LOAD_ATTR",
                "operands": "23 (NULL|self + join)",
                "comment": ""
              },
              {
                "addr": "266",
                "op": "CALL",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "274",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "276",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "278",
                "op": "LOAD_NAME",
                "operands": "12 (print)",
                "comment": ""
              },
              {
                "addr": "280",
                "op": "LOAD_CONST",
                "operands": "6 ('Counter: ')",
                "comment": ""
              },
              {
                "addr": "282",
                "op": "LOAD_GLOBAL",
                "operands": "4 (counter)",
                "comment": ""
              },
              {
                "addr": "292",
                "op": "FORMAT_VALUE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "294",
                "op": "BUILD_STRING",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "296",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "304",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "306",
                "op": "RETURN_CONST",
                "operands": "1 (None)",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object increment at 0x72166b09ad30, file \"<input>\", line 7>",
            "instructions": [
              {
                "addr": "0",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "LOAD_GLOBAL",
                "operands": "1 (NULL + range)",
                "comment": ""
              },
              {
                "addr": "12",
                "op": "LOAD_FAST",
                "operands": "0 (n)",
                "comment": ""
              },
              {
                "addr": "14",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "22",
                "op": "GET_ITER",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "28",
                "op": "STORE_FAST",
                "operands": "1 (i)",
                "comment": ""
              },
              {
                "addr": "30",
                "op": "LOAD_GLOBAL",
                "operands": "2 (lock)",
                "comment": ""
              },
              {
                "addr": "40",
                "op": "LOAD_ATTR",
                "operands": "5 (NULL|self + acquire)",
                "comment": ""
              },
              {
                "addr": "60",
                "op": "CALL",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "68",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "70",
                "op": "LOAD_GLOBAL",
                "operands": "6 (counter)",
                "comment": ""
              },
              {
                "addr": "80",
                "op": "STORE_FAST",
                "operands": "2 (temp)",
                "comment": ""
              },
              {
                "addr": "82",
                "op": "LOAD_GLOBAL",
                "operands": "9 (NULL + time)",
                "comment": ""
              },
              {
                "addr": "92",
                "op": "LOAD_ATTR",
                "operands": "10 (sleep)",
                "comment": ""
              },
              {
                "addr": "112",
                "op": "LOAD_CONST",
                "operands": "1 (0.001)",
                "comment": ""
              },
              {
                "addr": "114",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "122",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "124",
                "op": "LOAD_FAST",
                "operands": "2 (temp)",
                "comment": ""
              },
              {
                "addr": "126",
                "op": "LOAD_CONST",
                "operands": "2 (1)",
                "comment": ""
              },
              {
                "addr": "128",
                "op": "BINARY_OP",
                "operands": "0 (+)",
                "comment": ""
              },
              {
                "addr": "132",
                "op": "STORE_GLOBAL",
                "operands": "3 (counter)",
                "comment": ""
              },
              {
                "addr": "134",
                "op": "LOAD_GLOBAL",
                "operands": "2 (lock)",
                "comment": ""
              },
              {
                "addr": "144",
                "op": "LOAD_ATTR",
                "operands": "13 (NULL|self + release)",
                "comment": ""
              },
              {
                "addr": "164",
                "op": "CALL",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "172",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "174",
                "op": "JUMP_BACKWARD",
                "operands": "76 (to 24)",
                "comment": ""
              },
              {
                "addr": "178",
                "op": "RETURN_CONST",
                "operands": "0 (None)",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object fast_sum at 0x72166b0e3930, file \"<input>\", line 16>",
            "instructions": [
              {
                "addr": "0",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "LOAD_GLOBAL",
                "operands": "1 (NULL + sum)",
                "comment": ""
              },
              {
                "addr": "12",
                "op": "LOAD_FAST",
                "operands": "0 (data)",
                "comment": ""
              },
              {
                "addr": "14",
                "op": "GET_ITER",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "16",
                "op": "LOAD_FAST_AND_CLEAR",
                "operands": "1 (x)",
                "comment": ""
              },
              {
                "addr": "18",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "20",
                "op": "BUILD_LIST",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "22",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "28",
                "op": "STORE_FAST",
                "operands": "1 (x)",
                "comment": ""
              },
              {
                "addr": "30",
                "op": "LOAD_FAST",
                "operands": "1 (x)",
                "comment": ""
              },
              {
                "addr": "32",
                "op": "LOAD_CONST",
                "operands": "1 (2)",
                "comment": ""
              },
              {
                "addr": "34",
                "op": "BINARY_OP",
                "operands": "5 (*)",
                "comment": ""
              },
              {
                "addr": "38",
                "op": "LIST_APPEND",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "40",
                "op": "JUMP_BACKWARD",
                "operands": "9 (to 24)",
                "comment": ""
              },
              {
                "addr": "44",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "46",
                "op": "STORE_FAST",
                "operands": "1 (x)",
                "comment": ""
              },
              {
                "addr": "48",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "56",
                "op": "STORE_FAST",
                "operands": "2 (result_comp)",
                "comment": ""
              },
              {
                "addr": "58",
                "op": "LOAD_CONST",
                "operands": "2 (0)",
                "comment": ""
              },
              {
                "addr": "60",
                "op": "STORE_FAST",
                "operands": "3 (result_loop)",
                "comment": ""
              },
              {
                "addr": "62",
                "op": "LOAD_FAST",
                "operands": "0 (data)",
                "comment": ""
              },
              {
                "addr": "64",
                "op": "GET_ITER",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "70",
                "op": "STORE_FAST",
                "operands": "1 (x)",
                "comment": ""
              },
              {
                "addr": "72",
                "op": "LOAD_FAST",
                "operands": "3 (result_loop)",
                "comment": ""
              },
              {
                "addr": "74",
                "op": "LOAD_FAST",
                "operands": "1 (x)",
                "comment": ""
              },
              {
                "addr": "76",
                "op": "LOAD_CONST",
                "operands": "1 (2)",
                "comment": ""
              },
              {
                "addr": "78",
                "op": "BINARY_OP",
                "operands": "5 (*)",
                "comment": ""
              },
              {
                "addr": "82",
                "op": "BINARY_OP",
                "operands": "13 (+=)",
                "comment": ""
              },
              {
                "addr": "86",
                "op": "STORE_FAST",
                "operands": "3 (result_loop)",
                "comment": ""
              },
              {
                "addr": "88",
                "op": "JUMP_BACKWARD",
                "operands": "12 (to 66)",
                "comment": ""
              },
              {
                "addr": "92",
                "op": "LOAD_FAST",
                "operands": "2 (result_comp)",
                "comment": ""
              },
              {
                "addr": "94",
                "op": "LOAD_FAST",
                "operands": "3 (result_loop)",
                "comment": ""
              },
              {
                "addr": "96",
                "op": "BUILD_TUPLE",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "98",
                "op": "RETURN_VALUE",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "102",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "104",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "106",
                "op": "STORE_FAST",
                "operands": "1 (x)",
                "comment": ""
              },
              {
                "addr": "108",
                "op": "RERAISE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "20",
                "op": "to",
                "operands": "42 -> 100 [4]",
                "comment": ""
              }
            ]
          }
        ],
        "notes": "Python bytecode via dis module."
      },
      "debugger": {
        "steps": [
          {
            "line": 1,
            "description": "import threading",
            "registers": {},
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 2,
            "description": "import time",
            "registers": {},
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 4,
            "description": "Assign counter = 0",
            "registers": {
              "counter": "0"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 5,
            "description": "Assign lock = threading.Lock()",
            "registers": {
              "counter": "0",
              "lock": "threading.Lock()"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 23,
            "description": "Assign t1 = threading.Thread(target=increment, args=...",
            "registers": {
              "counter": "0",
              "t1": "threading.Thread(target=increment, args=...",
              "lock": "threading.Lock()"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 24,
            "description": "Assign t2 = threading.Thread(target=increment, args=...",
            "registers": {
              "t2": "threading.Thread(target=increment, args=...",
              "t1": "threading.Thread(target=increment, args=...",
              "counter": "0",
              "lock": "threading.Lock()"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 25,
            "description": "t1.start()",
            "registers": {
              "t2": "threading.Thread(target=increment, args=...",
              "t1": "threading.Thread(target=increment, args=...",
              "counter": "0",
              "lock": "threading.Lock()"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 26,
            "description": "t2.start()",
            "registers": {
              "t2": "threading.Thread(target=increment, args=...",
              "t1": "threading.Thread(target=increment, args=...",
              "counter": "0",
              "lock": "threading.Lock()"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 27,
            "description": "t1.join()",
            "registers": {
              "t2": "threading.Thread(target=increment, args=...",
              "t1": "threading.Thread(target=increment, args=...",
              "counter": "0",
              "lock": "threading.Lock()"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 28,
            "description": "t2.join()",
            "registers": {
              "t2": "threading.Thread(target=increment, args=...",
              "t1": "threading.Thread(target=increment, args=...",
              "counter": "0",
              "lock": "threading.Lock()"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 29,
            "description": "print(f\"Counter: {counter}\")",
            "registers": {
              "t2": "threading.Thread(target=increment, args=...",
              "t1": "threading.Thread(target=increment, args=...",
              "counter": "0",
              "lock": "threading.Lock()"
            },
            "stack": [
              "<module>"
            ]
          }
        ]
      },
      "compare": {
        "comparisons": [
          {
            "title": "Manual lock.acquire/release vs with Statement",
            "patterns": [
              {
                "label": "Current: manual acquire/release",
                "code": "lock.acquire()\ntry:\n    ...\nfinally:\n    lock.release()",
                "cycles": "Same",
                "memory": "Same",
                "notes": "Risk of forgetting release on exception path"
              },
              {
                "label": "Alternative: context manager",
                "code": "with lock:\n    ...",
                "cycles": "Same",
                "memory": "Same",
                "notes": "Exception-safe, guaranteed release"
              }
            ],
            "winner": "Context manager — exception-safe, less error-prone"
          }
        ]
      }
    }
  },
  {
    "id": "py-fibonacci",
    "title": "Recursive Fibonacci",
    "description": "Classic recursion with exponential call tree",
    "language": "python",
    "code": "import functools\n\ndef fib_naive(n):\n    if n <= 1:\n        return n\n    return fib_naive(n - 1) + fib_naive(n - 2)\n\n@functools.lru_cache(maxsize=None)\ndef fib_cached(n):\n    if n <= 1:\n        return n\n    return fib_cached(n - 1) + fib_cached(n - 2)\n\nnaive_result = fib_naive(10)\ncached_result = fib_cached(50)\nprint(f\"Naive fib(10) = {naive_result}\")\nprint(f\"Cached fib(50) = {cached_result}\")",
    "analysis": {
      "language": "python",
      "execution": {
        "instructions": [
          {
            "op": "CALL",
            "detail": "call fib_naive(n)",
            "cycles": 100
          },
          {
            "op": "LOAD",
            "detail": "load param n",
            "cycles": 1
          },
          {
            "op": "STORE",
            "detail": "store return of fib_naive",
            "cycles": 1
          },
          {
            "op": "CALL",
            "detail": "call fib_cached(n)",
            "cycles": 100
          },
          {
            "op": "LOAD",
            "detail": "load param n",
            "cycles": 1
          },
          {
            "op": "STORE",
            "detail": "store return of fib_cached",
            "cycles": 1
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~31 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~33 chars",
            "cycles": 20
          }
        ],
        "maxCycles": 244,
        "summary": "8 pseudo-instructions, 244 estimated cycles (2 functions, 0 loops, 2 allocations)"
      },
      "cost": {
        "lines": [
          {
            "line": 3,
            "cost": 50,
            "label": "~50 cycles"
          },
          {
            "line": 9,
            "cost": 50,
            "label": "~50 cycles"
          },
          {
            "line": 16,
            "cost": 20,
            "label": "~20 cycles"
          },
          {
            "line": 17,
            "cost": 20,
            "label": "~20 cycles"
          }
        ],
        "maxCost": 50,
        "insights": "Line 9 is the hottest at ~50 estimated cycles. 2 function(s), 0 loop(s), 2 allocation(s) contribute to the total cost."
      },
      "memory": {
        "allocations": [
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~31 chars",
            "size": "~80 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~33 chars",
            "size": "~82 B"
          }
        ],
        "stackTotal": "0 B",
        "heapTotal": "162 B",
        "allocCount": 2,
        "notes": "2 heap allocations totaling ~162 B Largest: string of ~33 chars (~82 B)."
      },
      "concurrency": {
        "threads": [
          {
            "name": "main",
            "events": []
          }
        ],
        "warnings": [],
        "analysis": "No concurrency issues detected."
      },
      "assembly": {
        "arch": "cpython-bytecode",
        "blocks": [
          {
            "label": "module",
            "instructions": [
              {
                "addr": "0",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "LOAD_CONST",
                "operands": "0 (0)",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "LOAD_CONST",
                "operands": "1 (None)",
                "comment": ""
              },
              {
                "addr": "6",
                "op": "IMPORT_NAME",
                "operands": "0 (functools)",
                "comment": ""
              },
              {
                "addr": "8",
                "op": "STORE_NAME",
                "operands": "0 (functools)",
                "comment": ""
              },
              {
                "addr": "10",
                "op": "LOAD_CONST",
                "operands": "2 (<code object fib_naive at 0x753076821ac0, file \"<input>\", line 3>)",
                "comment": ""
              },
              {
                "addr": "12",
                "op": "MAKE_FUNCTION",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "14",
                "op": "STORE_NAME",
                "operands": "1 (fib_naive)",
                "comment": ""
              },
              {
                "addr": "16",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "18",
                "op": "LOAD_NAME",
                "operands": "0 (functools)",
                "comment": ""
              },
              {
                "addr": "20",
                "op": "LOAD_ATTR",
                "operands": "4 (lru_cache)",
                "comment": ""
              },
              {
                "addr": "40",
                "op": "LOAD_CONST",
                "operands": "1 (None)",
                "comment": ""
              },
              {
                "addr": "42",
                "op": "KW_NAMES",
                "operands": "3 (('maxsize',))",
                "comment": ""
              },
              {
                "addr": "44",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "52",
                "op": "LOAD_CONST",
                "operands": "4 (<code object fib_cached at 0x753076821bd0, file \"<input>\", line 8>)",
                "comment": ""
              },
              {
                "addr": "54",
                "op": "MAKE_FUNCTION",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "56",
                "op": "CALL",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "64",
                "op": "STORE_NAME",
                "operands": "3 (fib_cached)",
                "comment": ""
              },
              {
                "addr": "66",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "68",
                "op": "LOAD_NAME",
                "operands": "1 (fib_naive)",
                "comment": ""
              },
              {
                "addr": "70",
                "op": "LOAD_CONST",
                "operands": "5 (10)",
                "comment": ""
              },
              {
                "addr": "72",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "80",
                "op": "STORE_NAME",
                "operands": "4 (naive_result)",
                "comment": ""
              },
              {
                "addr": "82",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "84",
                "op": "LOAD_NAME",
                "operands": "3 (fib_cached)",
                "comment": ""
              },
              {
                "addr": "86",
                "op": "LOAD_CONST",
                "operands": "6 (50)",
                "comment": ""
              },
              {
                "addr": "88",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "96",
                "op": "STORE_NAME",
                "operands": "5 (cached_result)",
                "comment": ""
              },
              {
                "addr": "98",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "100",
                "op": "LOAD_NAME",
                "operands": "6 (print)",
                "comment": ""
              },
              {
                "addr": "102",
                "op": "LOAD_CONST",
                "operands": "7 ('Naive fib(10) = ')",
                "comment": ""
              },
              {
                "addr": "104",
                "op": "LOAD_NAME",
                "operands": "4 (naive_result)",
                "comment": ""
              },
              {
                "addr": "106",
                "op": "FORMAT_VALUE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "108",
                "op": "BUILD_STRING",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "110",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "118",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "120",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "122",
                "op": "LOAD_NAME",
                "operands": "6 (print)",
                "comment": ""
              },
              {
                "addr": "124",
                "op": "LOAD_CONST",
                "operands": "8 ('Cached fib(50) = ')",
                "comment": ""
              },
              {
                "addr": "126",
                "op": "LOAD_NAME",
                "operands": "5 (cached_result)",
                "comment": ""
              },
              {
                "addr": "128",
                "op": "FORMAT_VALUE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "130",
                "op": "BUILD_STRING",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "132",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "140",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "142",
                "op": "RETURN_CONST",
                "operands": "1 (None)",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object fib_naive at 0x753076821ac0, file \"<input>\", line 3>",
            "instructions": [
              {
                "addr": "0",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "LOAD_FAST",
                "operands": "0 (n)",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "LOAD_CONST",
                "operands": "1 (1)",
                "comment": ""
              },
              {
                "addr": "6",
                "op": "COMPARE_OP",
                "operands": "26 (<=)",
                "comment": ""
              },
              {
                "addr": "10",
                "op": "POP_JUMP_IF_FALSE",
                "operands": "2 (to 16)",
                "comment": ""
              },
              {
                "addr": "12",
                "op": "LOAD_FAST",
                "operands": "0 (n)",
                "comment": ""
              },
              {
                "addr": "14",
                "op": "RETURN_VALUE",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "26",
                "op": "LOAD_FAST",
                "operands": "0 (n)",
                "comment": ""
              },
              {
                "addr": "28",
                "op": "LOAD_CONST",
                "operands": "1 (1)",
                "comment": ""
              },
              {
                "addr": "30",
                "op": "BINARY_OP",
                "operands": "10 (-)",
                "comment": ""
              },
              {
                "addr": "34",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "42",
                "op": "LOAD_GLOBAL",
                "operands": "1 (NULL + fib_naive)",
                "comment": ""
              },
              {
                "addr": "52",
                "op": "LOAD_FAST",
                "operands": "0 (n)",
                "comment": ""
              },
              {
                "addr": "54",
                "op": "LOAD_CONST",
                "operands": "2 (2)",
                "comment": ""
              },
              {
                "addr": "56",
                "op": "BINARY_OP",
                "operands": "10 (-)",
                "comment": ""
              },
              {
                "addr": "60",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "68",
                "op": "BINARY_OP",
                "operands": "0 (+)",
                "comment": ""
              },
              {
                "addr": "72",
                "op": "RETURN_VALUE",
                "operands": "",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object fib_cached at 0x753076821bd0, file \"<input>\", line 8>",
            "instructions": [
              {
                "addr": "0",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "LOAD_FAST",
                "operands": "0 (n)",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "LOAD_CONST",
                "operands": "1 (1)",
                "comment": ""
              },
              {
                "addr": "6",
                "op": "COMPARE_OP",
                "operands": "26 (<=)",
                "comment": ""
              },
              {
                "addr": "10",
                "op": "POP_JUMP_IF_FALSE",
                "operands": "2 (to 16)",
                "comment": ""
              },
              {
                "addr": "12",
                "op": "LOAD_FAST",
                "operands": "0 (n)",
                "comment": ""
              },
              {
                "addr": "14",
                "op": "RETURN_VALUE",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "26",
                "op": "LOAD_FAST",
                "operands": "0 (n)",
                "comment": ""
              },
              {
                "addr": "28",
                "op": "LOAD_CONST",
                "operands": "1 (1)",
                "comment": ""
              },
              {
                "addr": "30",
                "op": "BINARY_OP",
                "operands": "10 (-)",
                "comment": ""
              },
              {
                "addr": "34",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "42",
                "op": "LOAD_GLOBAL",
                "operands": "1 (NULL + fib_cached)",
                "comment": ""
              },
              {
                "addr": "52",
                "op": "LOAD_FAST",
                "operands": "0 (n)",
                "comment": ""
              },
              {
                "addr": "54",
                "op": "LOAD_CONST",
                "operands": "2 (2)",
                "comment": ""
              },
              {
                "addr": "56",
                "op": "BINARY_OP",
                "operands": "10 (-)",
                "comment": ""
              },
              {
                "addr": "60",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "68",
                "op": "BINARY_OP",
                "operands": "0 (+)",
                "comment": ""
              },
              {
                "addr": "72",
                "op": "RETURN_VALUE",
                "operands": "",
                "comment": ""
              }
            ]
          }
        ],
        "notes": "Python bytecode via dis module."
      },
      "debugger": {
        "steps": [
          {
            "line": 1,
            "description": "import functools",
            "registers": {},
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 8,
            "description": "@functools.lru_cache(maxsize=None)",
            "registers": {},
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 14,
            "description": "Assign naive_result = fib_naive(10)",
            "registers": {
              "naive_result": "fib_naive(10)"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 15,
            "description": "Assign cached_result = fib_cached(50)",
            "registers": {
              "naive_result": "fib_naive(10)",
              "cached_result": "fib_cached(50)"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 16,
            "description": "print(f\"Naive fib(10) = {naive_result}\")",
            "registers": {
              "naive_result": "fib_naive(10)",
              "cached_result": "fib_cached(50)"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 17,
            "description": "print(f\"Cached fib(50) = {cached_result}\")",
            "registers": {
              "naive_result": "fib_naive(10)",
              "cached_result": "fib_cached(50)"
            },
            "stack": [
              "<module>"
            ]
          }
        ]
      },
      "compare": {
        "comparisons": []
      }
    }
  },
  {
    "id": "py-sort-compare",
    "title": "Sorting Algorithms",
    "description": "Bubble sort vs built-in Timsort performance",
    "language": "python",
    "code": "import random\n\ndef bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        swapped = False\n        for j in range(0, n - i - 1):\n            if arr[j] > arr[j + 1]:\n                arr[j], arr[j + 1] = arr[j + 1], arr[j]\n                swapped = True\n        if not swapped:\n            break\n    return arr\n\ndata = [random.randint(0, 1000) for _ in range(100)]\n\nsorted_bubble = bubble_sort(data.copy())\nsorted_builtin = sorted(data)\nprint(f\"Sorted: {sorted_builtin[:5]}...\")",
    "analysis": {
      "language": "python",
      "execution": {
        "instructions": [
          {
            "op": "CALL",
            "detail": "call bubble_sort(arr)",
            "cycles": 100
          },
          {
            "op": "LOAD",
            "detail": "load param arr",
            "cycles": 1
          },
          {
            "op": "STORE",
            "detail": "store return of bubble_sort",
            "cycles": 1
          },
          {
            "op": "LOOP_START",
            "detail": "for loop ~100 iterations (lines 5-12)",
            "cycles": 8
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "CMP",
            "detail": "loop condition x100",
            "cycles": 500
          },
          {
            "op": "LOOP_END",
            "detail": "end for loop",
            "cycles": 0
          },
          {
            "op": "LOOP_START",
            "detail": "for loop ~100 iterations (lines 7-10)",
            "cycles": 8
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "CMP",
            "detail": "loop condition x100",
            "cycles": 500
          },
          {
            "op": "LOOP_END",
            "detail": "end for loop",
            "cycles": 0
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~32 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate list_comprehension (Heap) — list comprehension (size depends on input)",
            "cycles": 20
          }
        ],
        "maxCycles": 3958,
        "summary": "15 pseudo-instructions, 3958 estimated cycles (1 functions, 2 loops, 2 allocations)"
      },
      "cost": {
        "lines": [
          {
            "line": 3,
            "cost": 50,
            "label": "~50 cycles"
          },
          {
            "line": 5,
            "cost": 8,
            "label": "~8 cycles"
          },
          {
            "line": 6,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 7,
            "cost": 508,
            "label": "~508 cycles"
          },
          {
            "line": 8,
            "cost": 1000,
            "label": "~1000 cycles"
          },
          {
            "line": 9,
            "cost": 1000,
            "label": "~1000 cycles"
          },
          {
            "line": 10,
            "cost": 1000,
            "label": "~1000 cycles"
          },
          {
            "line": 11,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 12,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 15,
            "cost": 20,
            "label": "~20 cycles"
          },
          {
            "line": 19,
            "cost": 20,
            "label": "~20 cycles"
          }
        ],
        "maxCost": 1000,
        "insights": "Line 10 is the hottest at ~1000 estimated cycles. 1 function(s), 2 loop(s), 2 allocation(s) contribute to the total cost."
      },
      "memory": {
        "allocations": [
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~32 chars",
            "size": "~81 B"
          },
          {
            "type": "heap",
            "name": "list_comprehension",
            "detail": "list comprehension (size depends on input)",
            "size": "~dynamic B"
          }
        ],
        "stackTotal": "0 B",
        "heapTotal": "81 B",
        "allocCount": 2,
        "notes": "2 heap allocations totaling ~81 B Largest: string of ~32 chars (~81 B)."
      },
      "concurrency": {
        "threads": [
          {
            "name": "main",
            "events": []
          }
        ],
        "warnings": [],
        "analysis": "No concurrency issues detected."
      },
      "assembly": {
        "arch": "cpython-bytecode",
        "blocks": [
          {
            "label": "module",
            "instructions": [
              {
                "addr": "0",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "LOAD_CONST",
                "operands": "0 (0)",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "LOAD_CONST",
                "operands": "1 (None)",
                "comment": ""
              },
              {
                "addr": "6",
                "op": "IMPORT_NAME",
                "operands": "0 (random)",
                "comment": ""
              },
              {
                "addr": "8",
                "op": "STORE_NAME",
                "operands": "0 (random)",
                "comment": ""
              },
              {
                "addr": "10",
                "op": "LOAD_CONST",
                "operands": "2 (<code object bubble_sort at 0x72d8083eb3c0, file \"<input>\", line 3>)",
                "comment": ""
              },
              {
                "addr": "12",
                "op": "MAKE_FUNCTION",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "14",
                "op": "STORE_NAME",
                "operands": "1 (bubble_sort)",
                "comment": ""
              },
              {
                "addr": "16",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "18",
                "op": "LOAD_NAME",
                "operands": "2 (range)",
                "comment": ""
              },
              {
                "addr": "20",
                "op": "LOAD_CONST",
                "operands": "3 (100)",
                "comment": ""
              },
              {
                "addr": "22",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "30",
                "op": "GET_ITER",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "32",
                "op": "LOAD_FAST_AND_CLEAR",
                "operands": "0 (_)",
                "comment": ""
              },
              {
                "addr": "34",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "36",
                "op": "BUILD_LIST",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "38",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "44",
                "op": "STORE_FAST",
                "operands": "0 (_)",
                "comment": ""
              },
              {
                "addr": "46",
                "op": "LOAD_NAME",
                "operands": "0 (random)",
                "comment": ""
              },
              {
                "addr": "48",
                "op": "LOAD_ATTR",
                "operands": "7 (NULL|self + randint)",
                "comment": ""
              },
              {
                "addr": "68",
                "op": "LOAD_CONST",
                "operands": "0 (0)",
                "comment": ""
              },
              {
                "addr": "70",
                "op": "LOAD_CONST",
                "operands": "4 (1000)",
                "comment": ""
              },
              {
                "addr": "72",
                "op": "CALL",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "80",
                "op": "LIST_APPEND",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "82",
                "op": "JUMP_BACKWARD",
                "operands": "22 (to 40)",
                "comment": ""
              },
              {
                "addr": "86",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "88",
                "op": "STORE_FAST",
                "operands": "0 (_)",
                "comment": ""
              },
              {
                "addr": "90",
                "op": "STORE_NAME",
                "operands": "4 (data)",
                "comment": ""
              },
              {
                "addr": "92",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "94",
                "op": "LOAD_NAME",
                "operands": "1 (bubble_sort)",
                "comment": ""
              },
              {
                "addr": "96",
                "op": "LOAD_NAME",
                "operands": "4 (data)",
                "comment": ""
              },
              {
                "addr": "98",
                "op": "LOAD_ATTR",
                "operands": "11 (NULL|self + copy)",
                "comment": ""
              },
              {
                "addr": "118",
                "op": "CALL",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "126",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "134",
                "op": "STORE_NAME",
                "operands": "6 (sorted_bubble)",
                "comment": ""
              },
              {
                "addr": "136",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "138",
                "op": "LOAD_NAME",
                "operands": "7 (sorted)",
                "comment": ""
              },
              {
                "addr": "140",
                "op": "LOAD_NAME",
                "operands": "4 (data)",
                "comment": ""
              },
              {
                "addr": "142",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "150",
                "op": "STORE_NAME",
                "operands": "8 (sorted_builtin)",
                "comment": ""
              },
              {
                "addr": "152",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "154",
                "op": "LOAD_NAME",
                "operands": "9 (print)",
                "comment": ""
              },
              {
                "addr": "156",
                "op": "LOAD_CONST",
                "operands": "5 ('Sorted: ')",
                "comment": ""
              },
              {
                "addr": "158",
                "op": "LOAD_NAME",
                "operands": "8 (sorted_builtin)",
                "comment": ""
              },
              {
                "addr": "160",
                "op": "LOAD_CONST",
                "operands": "1 (None)",
                "comment": ""
              },
              {
                "addr": "162",
                "op": "LOAD_CONST",
                "operands": "6 (5)",
                "comment": ""
              },
              {
                "addr": "164",
                "op": "BINARY_SLICE",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "166",
                "op": "FORMAT_VALUE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "168",
                "op": "LOAD_CONST",
                "operands": "7 ('...')",
                "comment": ""
              },
              {
                "addr": "170",
                "op": "BUILD_STRING",
                "operands": "3",
                "comment": ""
              },
              {
                "addr": "172",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "180",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "182",
                "op": "RETURN_CONST",
                "operands": "1 (None)",
                "comment": ""
              },
              {
                "addr": "186",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "188",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "190",
                "op": "STORE_FAST",
                "operands": "0 (_)",
                "comment": ""
              },
              {
                "addr": "192",
                "op": "RERAISE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "36",
                "op": "to",
                "operands": "84 -> 184 [2]",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object bubble_sort at 0x72d8083eb3c0, file \"<input>\", line 3>",
            "instructions": [
              {
                "addr": "0",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "LOAD_GLOBAL",
                "operands": "1 (NULL + len)",
                "comment": ""
              },
              {
                "addr": "12",
                "op": "LOAD_FAST",
                "operands": "0 (arr)",
                "comment": ""
              },
              {
                "addr": "14",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "22",
                "op": "STORE_FAST",
                "operands": "1 (n)",
                "comment": ""
              },
              {
                "addr": "24",
                "op": "LOAD_GLOBAL",
                "operands": "3 (NULL + range)",
                "comment": ""
              },
              {
                "addr": "34",
                "op": "LOAD_FAST",
                "operands": "1 (n)",
                "comment": ""
              },
              {
                "addr": "36",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "44",
                "op": "GET_ITER",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "50",
                "op": "STORE_FAST",
                "operands": "2 (i)",
                "comment": ""
              },
              {
                "addr": "52",
                "op": "LOAD_CONST",
                "operands": "1 (False)",
                "comment": ""
              },
              {
                "addr": "54",
                "op": "STORE_FAST",
                "operands": "3 (swapped)",
                "comment": ""
              },
              {
                "addr": "56",
                "op": "LOAD_GLOBAL",
                "operands": "3 (NULL + range)",
                "comment": ""
              },
              {
                "addr": "66",
                "op": "LOAD_CONST",
                "operands": "2 (0)",
                "comment": ""
              },
              {
                "addr": "68",
                "op": "LOAD_FAST",
                "operands": "1 (n)",
                "comment": ""
              },
              {
                "addr": "70",
                "op": "LOAD_FAST",
                "operands": "2 (i)",
                "comment": ""
              },
              {
                "addr": "72",
                "op": "BINARY_OP",
                "operands": "10 (-)",
                "comment": ""
              },
              {
                "addr": "76",
                "op": "LOAD_CONST",
                "operands": "3 (1)",
                "comment": ""
              },
              {
                "addr": "78",
                "op": "BINARY_OP",
                "operands": "10 (-)",
                "comment": ""
              },
              {
                "addr": "82",
                "op": "CALL",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "90",
                "op": "GET_ITER",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "96",
                "op": "STORE_FAST",
                "operands": "4 (j)",
                "comment": ""
              },
              {
                "addr": "98",
                "op": "LOAD_FAST",
                "operands": "0 (arr)",
                "comment": ""
              },
              {
                "addr": "100",
                "op": "LOAD_FAST",
                "operands": "4 (j)",
                "comment": ""
              },
              {
                "addr": "102",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "106",
                "op": "LOAD_FAST",
                "operands": "0 (arr)",
                "comment": ""
              },
              {
                "addr": "108",
                "op": "LOAD_FAST",
                "operands": "4 (j)",
                "comment": ""
              },
              {
                "addr": "110",
                "op": "LOAD_CONST",
                "operands": "3 (1)",
                "comment": ""
              },
              {
                "addr": "112",
                "op": "BINARY_OP",
                "operands": "0 (+)",
                "comment": ""
              },
              {
                "addr": "116",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "120",
                "op": "COMPARE_OP",
                "operands": "68 (>)",
                "comment": ""
              },
              {
                "addr": "124",
                "op": "POP_JUMP_IF_TRUE",
                "operands": "1 (to 128)",
                "comment": ""
              },
              {
                "addr": "126",
                "op": "JUMP_BACKWARD",
                "operands": "18 (to 92)",
                "comment": ""
              },
              {
                "addr": "130",
                "op": "LOAD_FAST",
                "operands": "4 (j)",
                "comment": ""
              },
              {
                "addr": "132",
                "op": "LOAD_CONST",
                "operands": "3 (1)",
                "comment": ""
              },
              {
                "addr": "134",
                "op": "BINARY_OP",
                "operands": "0 (+)",
                "comment": ""
              },
              {
                "addr": "138",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "142",
                "op": "LOAD_FAST",
                "operands": "0 (arr)",
                "comment": ""
              },
              {
                "addr": "144",
                "op": "LOAD_FAST",
                "operands": "4 (j)",
                "comment": ""
              },
              {
                "addr": "146",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "150",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "152",
                "op": "LOAD_FAST",
                "operands": "0 (arr)",
                "comment": ""
              },
              {
                "addr": "154",
                "op": "LOAD_FAST",
                "operands": "4 (j)",
                "comment": ""
              },
              {
                "addr": "156",
                "op": "STORE_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "160",
                "op": "LOAD_FAST",
                "operands": "0 (arr)",
                "comment": ""
              },
              {
                "addr": "162",
                "op": "LOAD_FAST",
                "operands": "4 (j)",
                "comment": ""
              },
              {
                "addr": "164",
                "op": "LOAD_CONST",
                "operands": "3 (1)",
                "comment": ""
              },
              {
                "addr": "166",
                "op": "BINARY_OP",
                "operands": "0 (+)",
                "comment": ""
              },
              {
                "addr": "170",
                "op": "STORE_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "174",
                "op": "LOAD_CONST",
                "operands": "4 (True)",
                "comment": ""
              },
              {
                "addr": "176",
                "op": "STORE_FAST",
                "operands": "3 (swapped)",
                "comment": ""
              },
              {
                "addr": "178",
                "op": "JUMP_BACKWARD",
                "operands": "44 (to 92)",
                "comment": ""
              },
              {
                "addr": "182",
                "op": "LOAD_FAST",
                "operands": "3 (swapped)",
                "comment": ""
              },
              {
                "addr": "184",
                "op": "POP_JUMP_IF_FALSE",
                "operands": "1 (to 188)",
                "comment": ""
              },
              {
                "addr": "186",
                "op": "JUMP_BACKWARD",
                "operands": "71 (to 46)",
                "comment": ""
              },
              {
                "addr": "190",
                "op": "LOAD_FAST",
                "operands": "0 (arr)",
                "comment": ""
              },
              {
                "addr": "192",
                "op": "RETURN_VALUE",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "196",
                "op": "LOAD_FAST",
                "operands": "0 (arr)",
                "comment": ""
              },
              {
                "addr": "198",
                "op": "RETURN_VALUE",
                "operands": "",
                "comment": ""
              }
            ]
          }
        ],
        "notes": "Python bytecode via dis module."
      },
      "debugger": {
        "steps": [
          {
            "line": 1,
            "description": "import random",
            "registers": {},
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 15,
            "description": "Assign data = [random.randint(0, 1000) for _ in range(...",
            "registers": {
              "data": "[random.randint(0, 1000) for _ in range(..."
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 17,
            "description": "Assign sorted_bubble = bubble_sort(data.copy())",
            "registers": {
              "sorted_bubble": "bubble_sort(data.copy())",
              "data": "[random.randint(0, 1000) for _ in range(..."
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 18,
            "description": "Assign sorted_builtin = sorted(data)",
            "registers": {
              "sorted_bubble": "bubble_sort(data.copy())",
              "sorted_builtin": "sorted(data)",
              "data": "[random.randint(0, 1000) for _ in range(..."
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 19,
            "description": "print(f\"Sorted: {sorted_builtin[:5]}...\")",
            "registers": {
              "sorted_bubble": "bubble_sort(data.copy())",
              "sorted_builtin": "sorted(data)",
              "data": "[random.randint(0, 1000) for _ in range(..."
            },
            "stack": [
              "<module>"
            ]
          }
        ]
      },
      "compare": {
        "comparisons": []
      }
    }
  },
  {
    "id": "py-async-io",
    "title": "Async I/O Pattern",
    "description": "Coroutines, event loop, and concurrent awaits",
    "language": "python",
    "code": "import asyncio\n\nasync def fetch_data(url, delay):\n    print(f\"Fetching {url}...\")\n    await asyncio.sleep(delay)\n    return {\"url\": url, \"status\": 200, \"bytes\": delay * 1000}\n\nasync def process_batch(urls):\n    tasks = [fetch_data(url, i * 0.5) for i, url in enumerate(urls)]\n    results = await asyncio.gather(*tasks)\n    total_bytes = sum(r[\"bytes\"] for r in results)\n    return results, total_bytes\n\nasync def main():\n    urls = [\n        \"https://api.example.com/users\",\n        \"https://api.example.com/posts\",\n        \"https://api.example.com/comments\",\n    ]\n    results, total = await process_batch(urls)\n    for r in results:\n        print(f\"  {r['url']} -> {r['status']}\")\n    print(f\"Total bytes: {total}\")\n\nasyncio.run(main())",
    "analysis": {
      "language": "python",
      "execution": {
        "instructions": [
          {
            "op": "CALL",
            "detail": "call fetch_data(url, delay)",
            "cycles": 100
          },
          {
            "op": "LOAD",
            "detail": "load param url",
            "cycles": 1
          },
          {
            "op": "LOAD",
            "detail": "load param delay",
            "cycles": 1
          },
          {
            "op": "STORE",
            "detail": "store return of fetch_data",
            "cycles": 1
          },
          {
            "op": "CALL",
            "detail": "call process_batch(urls)",
            "cycles": 100
          },
          {
            "op": "LOAD",
            "detail": "load param urls",
            "cycles": 1
          },
          {
            "op": "STORE",
            "detail": "store return of process_batch",
            "cycles": 1
          },
          {
            "op": "CALL",
            "detail": "call main()",
            "cycles": 100
          },
          {
            "op": "STORE",
            "detail": "store return of main",
            "cycles": 1
          },
          {
            "op": "LOOP_START",
            "detail": "for loop ~100 iterations (lines 21-22)",
            "cycles": 8
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "CMP",
            "detail": "loop condition x100",
            "cycles": 500
          },
          {
            "op": "LOOP_END",
            "detail": "end for loop",
            "cycles": 0
          },
          {
            "op": "ALLOC",
            "detail": "allocate list (Heap) — list with 3 elements",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate dict (Heap) — dict with 3 entries",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~18 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~3 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~6 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~5 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~5 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~29 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~29 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~32 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~30 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~3 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~6 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~21 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate list_comprehension (Heap) — list comprehension (size depends on input)",
            "cycles": 20
          }
        ],
        "maxCycles": 1814,
        "summary": "28 pseudo-instructions, 1814 estimated cycles (3 functions, 1 loops, 15 allocations)"
      },
      "cost": {
        "lines": [
          {
            "line": 3,
            "cost": 50,
            "label": "~50 cycles"
          },
          {
            "line": 4,
            "cost": 20,
            "label": "~20 cycles"
          },
          {
            "line": 6,
            "cost": 80,
            "label": "~80 cycles"
          },
          {
            "line": 8,
            "cost": 50,
            "label": "~50 cycles"
          },
          {
            "line": 9,
            "cost": 20,
            "label": "~20 cycles"
          },
          {
            "line": 11,
            "cost": 20,
            "label": "~20 cycles"
          },
          {
            "line": 14,
            "cost": 50,
            "label": "~50 cycles"
          },
          {
            "line": 15,
            "cost": 20,
            "label": "~20 cycles"
          },
          {
            "line": 16,
            "cost": 20,
            "label": "~20 cycles"
          },
          {
            "line": 17,
            "cost": 20,
            "label": "~20 cycles"
          },
          {
            "line": 18,
            "cost": 20,
            "label": "~20 cycles"
          },
          {
            "line": 21,
            "cost": 8,
            "label": "~8 cycles"
          },
          {
            "line": 22,
            "cost": 560,
            "label": "~560 cycles"
          },
          {
            "line": 23,
            "cost": 20,
            "label": "~20 cycles"
          }
        ],
        "maxCost": 560,
        "insights": "Line 22 is the hottest at ~560 estimated cycles. 3 function(s), 1 loop(s), 15 allocation(s) contribute to the total cost."
      },
      "memory": {
        "allocations": [
          {
            "type": "heap",
            "name": "list",
            "detail": "list with 3 elements",
            "size": "~80 B"
          },
          {
            "type": "heap",
            "name": "dict",
            "detail": "dict with 3 entries",
            "size": "~232 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~18 chars",
            "size": "~67 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~3 chars",
            "size": "~52 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~6 chars",
            "size": "~55 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~5 chars",
            "size": "~54 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~5 chars",
            "size": "~54 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~29 chars",
            "size": "~78 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~29 chars",
            "size": "~78 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~32 chars",
            "size": "~81 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~30 chars",
            "size": "~79 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~3 chars",
            "size": "~52 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~6 chars",
            "size": "~55 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~21 chars",
            "size": "~70 B"
          },
          {
            "type": "heap",
            "name": "list_comprehension",
            "detail": "list comprehension (size depends on input)",
            "size": "~dynamic B"
          }
        ],
        "stackTotal": "0 B",
        "heapTotal": "1.1 KB",
        "allocCount": 15,
        "notes": "15 heap allocations totaling ~1.1 KB Largest: dict with 3 entries (~232 B). Warning: heavy heap usage detected."
      },
      "concurrency": {
        "threads": [
          {
            "name": "main",
            "events": [
              {
                "type": "spawn",
                "label": "async_gather: asyncio.gather(*tasks)"
              },
              {
                "type": "spawn",
                "label": "await: await asyncio.sleep(delay)"
              },
              {
                "type": "spawn",
                "label": "await: await asyncio.gather(*tasks)"
              },
              {
                "type": "spawn",
                "label": "await: await process_batch(urls)"
              }
            ]
          }
        ],
        "warnings": [],
        "analysis": "No concurrency issues detected."
      },
      "assembly": {
        "arch": "cpython-bytecode",
        "blocks": [
          {
            "label": "module",
            "instructions": [
              {
                "addr": "0",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "LOAD_CONST",
                "operands": "0 (0)",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "LOAD_CONST",
                "operands": "1 (None)",
                "comment": ""
              },
              {
                "addr": "6",
                "op": "IMPORT_NAME",
                "operands": "0 (asyncio)",
                "comment": ""
              },
              {
                "addr": "8",
                "op": "STORE_NAME",
                "operands": "0 (asyncio)",
                "comment": ""
              },
              {
                "addr": "10",
                "op": "LOAD_CONST",
                "operands": "2 (<code object fetch_data at 0x72d2c1fb8030, file \"<input>\", line 3>)",
                "comment": ""
              },
              {
                "addr": "12",
                "op": "MAKE_FUNCTION",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "14",
                "op": "STORE_NAME",
                "operands": "1 (fetch_data)",
                "comment": ""
              },
              {
                "addr": "16",
                "op": "LOAD_CONST",
                "operands": "3 (<code object process_batch at 0x72d2c1fef550, file \"<input>\", line 8>)",
                "comment": ""
              },
              {
                "addr": "18",
                "op": "MAKE_FUNCTION",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "20",
                "op": "STORE_NAME",
                "operands": "2 (process_batch)",
                "comment": ""
              },
              {
                "addr": "22",
                "op": "LOAD_CONST",
                "operands": "4 (<code object main at 0x72d2c2859e70, file \"<input>\", line 14>)",
                "comment": ""
              },
              {
                "addr": "24",
                "op": "MAKE_FUNCTION",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "26",
                "op": "STORE_NAME",
                "operands": "3 (main)",
                "comment": ""
              },
              {
                "addr": "28",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "30",
                "op": "LOAD_NAME",
                "operands": "0 (asyncio)",
                "comment": ""
              },
              {
                "addr": "32",
                "op": "LOAD_ATTR",
                "operands": "8 (run)",
                "comment": ""
              },
              {
                "addr": "52",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "54",
                "op": "LOAD_NAME",
                "operands": "3 (main)",
                "comment": ""
              },
              {
                "addr": "56",
                "op": "CALL",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "64",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "72",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "74",
                "op": "RETURN_CONST",
                "operands": "1 (None)",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object fetch_data at 0x72d2c1fb8030, file \"<input>\", line 3>",
            "instructions": [
              {
                "addr": "0",
                "op": "RETURN_GENERATOR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "6",
                "op": "LOAD_GLOBAL",
                "operands": "1 (NULL + print)",
                "comment": ""
              },
              {
                "addr": "16",
                "op": "LOAD_CONST",
                "operands": "1 ('Fetching ')",
                "comment": ""
              },
              {
                "addr": "18",
                "op": "LOAD_FAST",
                "operands": "0 (url)",
                "comment": ""
              },
              {
                "addr": "20",
                "op": "FORMAT_VALUE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "22",
                "op": "LOAD_CONST",
                "operands": "2 ('...')",
                "comment": ""
              },
              {
                "addr": "24",
                "op": "BUILD_STRING",
                "operands": "3",
                "comment": ""
              },
              {
                "addr": "26",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "34",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "36",
                "op": "LOAD_GLOBAL",
                "operands": "3 (NULL + asyncio)",
                "comment": ""
              },
              {
                "addr": "46",
                "op": "LOAD_ATTR",
                "operands": "4 (sleep)",
                "comment": ""
              },
              {
                "addr": "66",
                "op": "LOAD_FAST",
                "operands": "1 (delay)",
                "comment": ""
              },
              {
                "addr": "68",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "76",
                "op": "GET_AWAITABLE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "78",
                "op": "LOAD_CONST",
                "operands": "0 (None)",
                "comment": ""
              },
              {
                "addr": "84",
                "op": "YIELD_VALUE",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "86",
                "op": "RESUME",
                "operands": "3",
                "comment": ""
              },
              {
                "addr": "88",
                "op": "JUMP_BACKWARD_NO_INTERRUPT",
                "operands": "5 (to 80)",
                "comment": ""
              },
              {
                "addr": "92",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "94",
                "op": "LOAD_FAST",
                "operands": "0 (url)",
                "comment": ""
              },
              {
                "addr": "96",
                "op": "LOAD_CONST",
                "operands": "3 (200)",
                "comment": ""
              },
              {
                "addr": "98",
                "op": "LOAD_FAST",
                "operands": "1 (delay)",
                "comment": ""
              },
              {
                "addr": "100",
                "op": "LOAD_CONST",
                "operands": "4 (1000)",
                "comment": ""
              },
              {
                "addr": "102",
                "op": "BINARY_OP",
                "operands": "5 (*)",
                "comment": ""
              },
              {
                "addr": "106",
                "op": "LOAD_CONST",
                "operands": "5 (('url', 'status', 'bytes'))",
                "comment": ""
              },
              {
                "addr": "108",
                "op": "BUILD_CONST_KEY_MAP",
                "operands": "3",
                "comment": ""
              },
              {
                "addr": "110",
                "op": "RETURN_VALUE",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "114",
                "op": "JUMP_BACKWARD",
                "operands": "13 (to 90)",
                "comment": ""
              },
              {
                "addr": "118",
                "op": "RERAISE",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "to",
                "operands": "82 -> 116 [0] lasti",
                "comment": ""
              },
              {
                "addr": "84",
                "op": "to",
                "operands": "84 -> 112 [2]",
                "comment": ""
              },
              {
                "addr": "86",
                "op": "to",
                "operands": "112 -> 116 [0] lasti",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object process_batch at 0x72d2c1fef550, file \"<input>\", line 8>",
            "instructions": [
              {
                "addr": "0",
                "op": "RETURN_GENERATOR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "6",
                "op": "LOAD_GLOBAL",
                "operands": "1 (NULL + enumerate)",
                "comment": ""
              },
              {
                "addr": "16",
                "op": "LOAD_FAST",
                "operands": "0 (urls)",
                "comment": ""
              },
              {
                "addr": "18",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "26",
                "op": "GET_ITER",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "28",
                "op": "LOAD_FAST_AND_CLEAR",
                "operands": "1 (i)",
                "comment": ""
              },
              {
                "addr": "30",
                "op": "LOAD_FAST_AND_CLEAR",
                "operands": "2 (url)",
                "comment": ""
              },
              {
                "addr": "32",
                "op": "SWAP",
                "operands": "3",
                "comment": ""
              },
              {
                "addr": "34",
                "op": "BUILD_LIST",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "36",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "42",
                "op": "UNPACK_SEQUENCE",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "46",
                "op": "STORE_FAST",
                "operands": "1 (i)",
                "comment": ""
              },
              {
                "addr": "48",
                "op": "STORE_FAST",
                "operands": "2 (url)",
                "comment": ""
              },
              {
                "addr": "50",
                "op": "LOAD_GLOBAL",
                "operands": "3 (NULL + fetch_data)",
                "comment": ""
              },
              {
                "addr": "60",
                "op": "LOAD_FAST",
                "operands": "2 (url)",
                "comment": ""
              },
              {
                "addr": "62",
                "op": "LOAD_FAST",
                "operands": "1 (i)",
                "comment": ""
              },
              {
                "addr": "64",
                "op": "LOAD_CONST",
                "operands": "1 (0.5)",
                "comment": ""
              },
              {
                "addr": "66",
                "op": "BINARY_OP",
                "operands": "5 (*)",
                "comment": ""
              },
              {
                "addr": "70",
                "op": "CALL",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "78",
                "op": "LIST_APPEND",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "80",
                "op": "JUMP_BACKWARD",
                "operands": "22 (to 38)",
                "comment": ""
              },
              {
                "addr": "84",
                "op": "STORE_FAST",
                "operands": "3 (tasks)",
                "comment": ""
              },
              {
                "addr": "86",
                "op": "STORE_FAST",
                "operands": "1 (i)",
                "comment": ""
              },
              {
                "addr": "88",
                "op": "STORE_FAST",
                "operands": "2 (url)",
                "comment": ""
              },
              {
                "addr": "90",
                "op": "LOAD_GLOBAL",
                "operands": "5 (NULL + asyncio)",
                "comment": ""
              },
              {
                "addr": "100",
                "op": "LOAD_ATTR",
                "operands": "6 (gather)",
                "comment": ""
              },
              {
                "addr": "120",
                "op": "LOAD_FAST",
                "operands": "3 (tasks)",
                "comment": ""
              },
              {
                "addr": "122",
                "op": "CALL_FUNCTION_EX",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "124",
                "op": "GET_AWAITABLE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "126",
                "op": "LOAD_CONST",
                "operands": "0 (None)",
                "comment": ""
              },
              {
                "addr": "132",
                "op": "YIELD_VALUE",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "134",
                "op": "RESUME",
                "operands": "3",
                "comment": ""
              },
              {
                "addr": "136",
                "op": "JUMP_BACKWARD_NO_INTERRUPT",
                "operands": "5 (to 128)",
                "comment": ""
              },
              {
                "addr": "140",
                "op": "STORE_FAST",
                "operands": "4 (results)",
                "comment": ""
              },
              {
                "addr": "142",
                "op": "LOAD_GLOBAL",
                "operands": "9 (NULL + sum)",
                "comment": ""
              },
              {
                "addr": "152",
                "op": "LOAD_CONST",
                "operands": "2 (<code object <genexpr> at 0x72d2c1e0e010, file \"<input>\", line 11>)",
                "comment": ""
              },
              {
                "addr": "154",
                "op": "MAKE_FUNCTION",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "156",
                "op": "LOAD_FAST",
                "operands": "4 (results)",
                "comment": ""
              },
              {
                "addr": "158",
                "op": "GET_ITER",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "160",
                "op": "CALL",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "168",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "176",
                "op": "STORE_FAST",
                "operands": "5 (total_bytes)",
                "comment": ""
              },
              {
                "addr": "178",
                "op": "LOAD_FAST",
                "operands": "4 (results)",
                "comment": ""
              },
              {
                "addr": "180",
                "op": "LOAD_FAST",
                "operands": "5 (total_bytes)",
                "comment": ""
              },
              {
                "addr": "182",
                "op": "BUILD_TUPLE",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "184",
                "op": "RETURN_VALUE",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "188",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "190",
                "op": "SWAP",
                "operands": "3",
                "comment": ""
              },
              {
                "addr": "192",
                "op": "STORE_FAST",
                "operands": "2 (url)",
                "comment": ""
              },
              {
                "addr": "194",
                "op": "STORE_FAST",
                "operands": "1 (i)",
                "comment": ""
              },
              {
                "addr": "196",
                "op": "RERAISE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "200",
                "op": "JUMP_BACKWARD",
                "operands": "32 (to 138)",
                "comment": ""
              },
              {
                "addr": "204",
                "op": "RERAISE",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "to",
                "operands": "32 -> 202 [0] lasti",
                "comment": ""
              },
              {
                "addr": "34",
                "op": "to",
                "operands": "82 -> 186 [3]",
                "comment": ""
              },
              {
                "addr": "84",
                "op": "to",
                "operands": "130 -> 202 [0] lasti",
                "comment": ""
              },
              {
                "addr": "132",
                "op": "to",
                "operands": "132 -> 198 [2]",
                "comment": ""
              },
              {
                "addr": "134",
                "op": "to",
                "operands": "198 -> 202 [0] lasti",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object <genexpr> at 0x72d2c1e0e010, file \"<input>\", line 11>",
            "instructions": [
              {
                "addr": "0",
                "op": "RETURN_GENERATOR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "6",
                "op": "LOAD_FAST",
                "operands": "0 (.0)",
                "comment": ""
              },
              {
                "addr": "12",
                "op": "STORE_FAST",
                "operands": "1 (r)",
                "comment": ""
              },
              {
                "addr": "14",
                "op": "LOAD_FAST",
                "operands": "1 (r)",
                "comment": ""
              },
              {
                "addr": "16",
                "op": "LOAD_CONST",
                "operands": "0 ('bytes')",
                "comment": ""
              },
              {
                "addr": "18",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "22",
                "op": "YIELD_VALUE",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "24",
                "op": "RESUME",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "26",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "28",
                "op": "JUMP_BACKWARD",
                "operands": "11 (to 8)",
                "comment": ""
              },
              {
                "addr": "32",
                "op": "RETURN_CONST",
                "operands": "1 (None)",
                "comment": ""
              },
              {
                "addr": "36",
                "op": "RERAISE",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "to",
                "operands": "32 -> 34 [0] lasti",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object main at 0x72d2c2859e70, file \"<input>\", line 14>",
            "instructions": [
              {
                "addr": "0",
                "op": "RETURN_GENERATOR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "6",
                "op": "BUILD_LIST",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "8",
                "op": "LOAD_CONST",
                "operands": "1 (('https://api.example.com/users', 'https://api.example.com/posts', 'https://api.example.com/comments'))",
                "comment": ""
              },
              {
                "addr": "10",
                "op": "LIST_EXTEND",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "12",
                "op": "STORE_FAST",
                "operands": "0 (urls)",
                "comment": ""
              },
              {
                "addr": "14",
                "op": "LOAD_GLOBAL",
                "operands": "1 (NULL + process_batch)",
                "comment": ""
              },
              {
                "addr": "24",
                "op": "LOAD_FAST",
                "operands": "0 (urls)",
                "comment": ""
              },
              {
                "addr": "26",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "34",
                "op": "GET_AWAITABLE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "36",
                "op": "LOAD_CONST",
                "operands": "0 (None)",
                "comment": ""
              },
              {
                "addr": "42",
                "op": "YIELD_VALUE",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "44",
                "op": "RESUME",
                "operands": "3",
                "comment": ""
              },
              {
                "addr": "46",
                "op": "JUMP_BACKWARD_NO_INTERRUPT",
                "operands": "5 (to 38)",
                "comment": ""
              },
              {
                "addr": "50",
                "op": "UNPACK_SEQUENCE",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "54",
                "op": "STORE_FAST",
                "operands": "1 (results)",
                "comment": ""
              },
              {
                "addr": "56",
                "op": "STORE_FAST",
                "operands": "2 (total)",
                "comment": ""
              },
              {
                "addr": "58",
                "op": "LOAD_FAST",
                "operands": "1 (results)",
                "comment": ""
              },
              {
                "addr": "60",
                "op": "GET_ITER",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "66",
                "op": "STORE_FAST",
                "operands": "3 (r)",
                "comment": ""
              },
              {
                "addr": "68",
                "op": "LOAD_GLOBAL",
                "operands": "3 (NULL + print)",
                "comment": ""
              },
              {
                "addr": "78",
                "op": "LOAD_CONST",
                "operands": "2 ('  ')",
                "comment": ""
              },
              {
                "addr": "80",
                "op": "LOAD_FAST",
                "operands": "3 (r)",
                "comment": ""
              },
              {
                "addr": "82",
                "op": "LOAD_CONST",
                "operands": "3 ('url')",
                "comment": ""
              },
              {
                "addr": "84",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "88",
                "op": "FORMAT_VALUE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "90",
                "op": "LOAD_CONST",
                "operands": "4 (' -> ')",
                "comment": ""
              },
              {
                "addr": "92",
                "op": "LOAD_FAST",
                "operands": "3 (r)",
                "comment": ""
              },
              {
                "addr": "94",
                "op": "LOAD_CONST",
                "operands": "5 ('status')",
                "comment": ""
              },
              {
                "addr": "96",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "100",
                "op": "FORMAT_VALUE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "102",
                "op": "BUILD_STRING",
                "operands": "4",
                "comment": ""
              },
              {
                "addr": "104",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "112",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "114",
                "op": "JUMP_BACKWARD",
                "operands": "27 (to 62)",
                "comment": ""
              },
              {
                "addr": "118",
                "op": "LOAD_GLOBAL",
                "operands": "3 (NULL + print)",
                "comment": ""
              },
              {
                "addr": "128",
                "op": "LOAD_CONST",
                "operands": "6 ('Total bytes: ')",
                "comment": ""
              },
              {
                "addr": "130",
                "op": "LOAD_FAST",
                "operands": "2 (total)",
                "comment": ""
              },
              {
                "addr": "132",
                "op": "FORMAT_VALUE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "134",
                "op": "BUILD_STRING",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "136",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "144",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "146",
                "op": "RETURN_CONST",
                "operands": "0 (None)",
                "comment": ""
              },
              {
                "addr": "150",
                "op": "JUMP_BACKWARD",
                "operands": "52 (to 48)",
                "comment": ""
              },
              {
                "addr": "154",
                "op": "RERAISE",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "to",
                "operands": "40 -> 152 [0] lasti",
                "comment": ""
              },
              {
                "addr": "42",
                "op": "to",
                "operands": "42 -> 148 [2]",
                "comment": ""
              },
              {
                "addr": "44",
                "op": "to",
                "operands": "148 -> 152 [0] lasti",
                "comment": ""
              }
            ]
          }
        ],
        "notes": "Python bytecode via dis module."
      },
      "debugger": {
        "steps": [
          {
            "line": 1,
            "description": "import asyncio",
            "registers": {},
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 3,
            "description": "Call fetch_data",
            "registers": {},
            "stack": [
              "<module>",
              "fetch_data()"
            ]
          },
          {
            "line": 4,
            "description": "  print(f\"Fetching {url}...\")",
            "registers": {},
            "stack": [
              "<module>",
              "fetch_data()"
            ]
          },
          {
            "line": 5,
            "description": "  await asyncio.sleep(delay)",
            "registers": {},
            "stack": [
              "<module>",
              "fetch_data()"
            ]
          },
          {
            "line": 6,
            "description": "  return {\"url\": url, \"status\": 200, \"bytes\": delay * 1000}",
            "registers": {},
            "stack": [
              "<module>",
              "fetch_data()"
            ]
          },
          {
            "line": 6,
            "description": "Return from fetch_data",
            "registers": {},
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 8,
            "description": "Call process_batch",
            "registers": {},
            "stack": [
              "<module>",
              "process_batch()"
            ]
          },
          {
            "line": 9,
            "description": "  tasks = [fetch_data(url, i * 0.5) for i, url in enumerate(urls)]",
            "registers": {},
            "stack": [
              "<module>",
              "process_batch()"
            ]
          },
          {
            "line": 10,
            "description": "  results = await asyncio.gather(*tasks)",
            "registers": {},
            "stack": [
              "<module>",
              "process_batch()"
            ]
          },
          {
            "line": 11,
            "description": "  total_bytes = sum(r[\"bytes\"] for r in results)",
            "registers": {},
            "stack": [
              "<module>",
              "process_batch()"
            ]
          },
          {
            "line": 12,
            "description": "  return results, total_bytes",
            "registers": {},
            "stack": [
              "<module>",
              "process_batch()"
            ]
          },
          {
            "line": 12,
            "description": "Return from process_batch",
            "registers": {},
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 14,
            "description": "Call main",
            "registers": {},
            "stack": [
              "<module>",
              "main()"
            ]
          },
          {
            "line": 15,
            "description": "  urls = [",
            "registers": {},
            "stack": [
              "<module>",
              "main()"
            ]
          },
          {
            "line": 16,
            "description": "  \"https://api.example.com/users\",",
            "registers": {},
            "stack": [
              "<module>",
              "main()"
            ]
          },
          {
            "line": 17,
            "description": "  \"https://api.example.com/posts\",",
            "registers": {},
            "stack": [
              "<module>",
              "main()"
            ]
          },
          {
            "line": 18,
            "description": "  \"https://api.example.com/comments\",",
            "registers": {},
            "stack": [
              "<module>",
              "main()"
            ]
          },
          {
            "line": 19,
            "description": "  ]",
            "registers": {},
            "stack": [
              "<module>",
              "main()"
            ]
          },
          {
            "line": 20,
            "description": "  results, total = await process_batch(urls)",
            "registers": {},
            "stack": [
              "<module>",
              "main()"
            ]
          },
          {
            "line": 21,
            "description": "  for r in results:",
            "registers": {},
            "stack": [
              "<module>",
              "main()"
            ]
          },
          {
            "line": 22,
            "description": "  print(f\"  {r['url']} -> {r['status']}\")",
            "registers": {},
            "stack": [
              "<module>",
              "main()"
            ]
          },
          {
            "line": 23,
            "description": "  print(f\"Total bytes: {total}\")",
            "registers": {},
            "stack": [
              "<module>",
              "main()"
            ]
          },
          {
            "line": 23,
            "description": "Return from main",
            "registers": {},
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 25,
            "description": "Call main",
            "registers": {},
            "stack": [
              "<module>",
              "main()"
            ]
          },
          {
            "line": 15,
            "description": "  urls = [",
            "registers": {},
            "stack": [
              "<module>",
              "main()"
            ]
          },
          {
            "line": 16,
            "description": "  \"https://api.example.com/users\",",
            "registers": {},
            "stack": [
              "<module>",
              "main()"
            ]
          },
          {
            "line": 17,
            "description": "  \"https://api.example.com/posts\",",
            "registers": {},
            "stack": [
              "<module>",
              "main()"
            ]
          },
          {
            "line": 18,
            "description": "  \"https://api.example.com/comments\",",
            "registers": {},
            "stack": [
              "<module>",
              "main()"
            ]
          },
          {
            "line": 19,
            "description": "  ]",
            "registers": {},
            "stack": [
              "<module>",
              "main()"
            ]
          },
          {
            "line": 20,
            "description": "  results, total = await process_batch(urls)",
            "registers": {},
            "stack": [
              "<module>",
              "main()"
            ]
          },
          {
            "line": 21,
            "description": "  for r in results:",
            "registers": {},
            "stack": [
              "<module>",
              "main()"
            ]
          },
          {
            "line": 22,
            "description": "  print(f\"  {r['url']} -> {r['status']}\")",
            "registers": {},
            "stack": [
              "<module>",
              "main()"
            ]
          },
          {
            "line": 23,
            "description": "  print(f\"Total bytes: {total}\")",
            "registers": {},
            "stack": [
              "<module>",
              "main()"
            ]
          },
          {
            "line": 23,
            "description": "Return from main",
            "registers": {},
            "stack": [
              "<module>"
            ]
          }
        ]
      },
      "compare": {
        "comparisons": []
      }
    }
  },
  {
    "id": "py-linked-list",
    "title": "Linked List Operations",
    "description": "Manual memory management with pointer-style nodes",
    "language": "python",
    "code": "class Node:\n    def __init__(self, value, next_node=None):\n        self.value = value\n        self.next = next_node\n\nclass LinkedList:\n    def __init__(self):\n        self.head = None\n        self.size = 0\n\n    def push(self, value):\n        self.head = Node(value, self.head)\n        self.size += 1\n\n    def pop(self):\n        if self.head is None:\n            raise IndexError(\"pop from empty list\")\n        value = self.head.value\n        self.head = self.head.next\n        self.size -= 1\n        return value\n\n    def reverse(self):\n        prev = None\n        current = self.head\n        while current:\n            next_node = current.next\n            current.next = prev\n            prev = current\n            current = next_node\n        self.head = prev\n\n    def to_list(self):\n        result = []\n        node = self.head\n        while node:\n            result.append(node.value)\n            node = node.next\n        return result\n\nll = LinkedList()\nfor i in range(10):\n    ll.push(i)\nprint(f\"Before reverse: {ll.to_list()}\")\nll.reverse()\nprint(f\"After reverse: {ll.to_list()}\")\npopped = ll.pop()\nprint(f\"Popped: {popped}, Size: {ll.size}\")",
    "analysis": {
      "language": "python",
      "execution": {
        "instructions": [
          {
            "op": "CALL",
            "detail": "call __init__(value, next_node)",
            "cycles": 100
          },
          {
            "op": "LOAD",
            "detail": "load param value",
            "cycles": 1
          },
          {
            "op": "LOAD",
            "detail": "load param next_node",
            "cycles": 1
          },
          {
            "op": "STORE",
            "detail": "store return of __init__",
            "cycles": 1
          },
          {
            "op": "CALL",
            "detail": "call __init__()",
            "cycles": 100
          },
          {
            "op": "STORE",
            "detail": "store return of __init__",
            "cycles": 1
          },
          {
            "op": "CALL",
            "detail": "call push(value)",
            "cycles": 100
          },
          {
            "op": "LOAD",
            "detail": "load param value",
            "cycles": 1
          },
          {
            "op": "STORE",
            "detail": "store return of push",
            "cycles": 1
          },
          {
            "op": "CALL",
            "detail": "call pop()",
            "cycles": 100
          },
          {
            "op": "STORE",
            "detail": "store return of pop",
            "cycles": 1
          },
          {
            "op": "CALL",
            "detail": "call reverse()",
            "cycles": 100
          },
          {
            "op": "STORE",
            "detail": "store return of reverse",
            "cycles": 1
          },
          {
            "op": "CALL",
            "detail": "call to_list()",
            "cycles": 100
          },
          {
            "op": "STORE",
            "detail": "store return of to_list",
            "cycles": 1
          },
          {
            "op": "LOOP_START",
            "detail": "while loop ~100 iterations (lines 26-30)",
            "cycles": 8
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "CMP",
            "detail": "loop condition x100",
            "cycles": 500
          },
          {
            "op": "LOOP_END",
            "detail": "end while loop",
            "cycles": 0
          },
          {
            "op": "LOOP_START",
            "detail": "while loop ~100 iterations (lines 36-38)",
            "cycles": 8
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "CMP",
            "detail": "loop condition x100",
            "cycles": 500
          },
          {
            "op": "LOOP_END",
            "detail": "end while loop",
            "cycles": 0
          },
          {
            "op": "LOOP_START",
            "detail": "for loop ~10 iterations (lines 42-43)",
            "cycles": 8
          },
          {
            "op": "ADD",
            "detail": "body statement x10",
            "cycles": 70
          },
          {
            "op": "CMP",
            "detail": "loop condition x10",
            "cycles": 50
          },
          {
            "op": "LOOP_END",
            "detail": "end for loop",
            "cycles": 0
          },
          {
            "op": "ALLOC",
            "detail": "allocate list (Heap) — list with 0 elements",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~19 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~31 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~30 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~34 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate Node (Heap) — Node instance",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate IndexError (Heap) — IndexError instance",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate LinkedList (Heap) — LinkedList instance",
            "cycles": 20
          }
        ],
        "maxCycles": 6113,
        "summary": "39 pseudo-instructions, 6113 estimated cycles (6 functions, 3 loops, 8 allocations)"
      },
      "cost": {
        "lines": [
          {
            "line": 2,
            "cost": 50,
            "label": "~50 cycles"
          },
          {
            "line": 7,
            "cost": 50,
            "label": "~50 cycles"
          },
          {
            "line": 11,
            "cost": 50,
            "label": "~50 cycles"
          },
          {
            "line": 12,
            "cost": 20,
            "label": "~20 cycles"
          },
          {
            "line": 15,
            "cost": 50,
            "label": "~50 cycles"
          },
          {
            "line": 17,
            "cost": 40,
            "label": "~40 cycles"
          },
          {
            "line": 23,
            "cost": 50,
            "label": "~50 cycles"
          },
          {
            "line": 26,
            "cost": 8,
            "label": "~8 cycles"
          },
          {
            "line": 27,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 28,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 29,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 30,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 33,
            "cost": 50,
            "label": "~50 cycles"
          },
          {
            "line": 34,
            "cost": 20,
            "label": "~20 cycles"
          },
          {
            "line": 36,
            "cost": 8,
            "label": "~8 cycles"
          },
          {
            "line": 37,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 38,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 41,
            "cost": 20,
            "label": "~20 cycles"
          },
          {
            "line": 42,
            "cost": 8,
            "label": "~8 cycles"
          },
          {
            "line": 43,
            "cost": 50,
            "label": "~50 cycles"
          },
          {
            "line": 44,
            "cost": 20,
            "label": "~20 cycles"
          },
          {
            "line": 46,
            "cost": 20,
            "label": "~20 cycles"
          },
          {
            "line": 48,
            "cost": 20,
            "label": "~20 cycles"
          }
        ],
        "maxCost": 500,
        "insights": "Line 38 is the hottest at ~500 estimated cycles. 6 function(s), 3 loop(s), 8 allocation(s) contribute to the total cost."
      },
      "memory": {
        "allocations": [
          {
            "type": "heap",
            "name": "list",
            "detail": "list with 0 elements",
            "size": "~56 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~19 chars",
            "size": "~68 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~31 chars",
            "size": "~80 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~30 chars",
            "size": "~79 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~34 chars",
            "size": "~83 B"
          },
          {
            "type": "heap",
            "name": "Node",
            "detail": "Node instance",
            "size": "~64+ B"
          },
          {
            "type": "heap",
            "name": "IndexError",
            "detail": "IndexError instance",
            "size": "~64+ B"
          },
          {
            "type": "heap",
            "name": "LinkedList",
            "detail": "LinkedList instance",
            "size": "~64+ B"
          }
        ],
        "stackTotal": "0 B",
        "heapTotal": "366 B",
        "allocCount": 8,
        "notes": "8 heap allocations totaling ~366 B Largest: string of ~34 chars (~83 B)."
      },
      "concurrency": {
        "threads": [
          {
            "name": "main",
            "events": []
          }
        ],
        "warnings": [],
        "analysis": "No concurrency issues detected."
      },
      "assembly": {
        "arch": "cpython-bytecode",
        "blocks": [
          {
            "label": "module",
            "instructions": [
              {
                "addr": "0",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "LOAD_BUILD_CLASS",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "6",
                "op": "LOAD_CONST",
                "operands": "0 (<code object Node at 0x73bdbf4fe4f0, file \"<input>\", line 1>)",
                "comment": ""
              },
              {
                "addr": "8",
                "op": "MAKE_FUNCTION",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "10",
                "op": "LOAD_CONST",
                "operands": "1 ('Node')",
                "comment": ""
              },
              {
                "addr": "12",
                "op": "CALL",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "20",
                "op": "STORE_NAME",
                "operands": "0 (Node)",
                "comment": ""
              },
              {
                "addr": "22",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "24",
                "op": "LOAD_BUILD_CLASS",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "26",
                "op": "LOAD_CONST",
                "operands": "2 (<code object LinkedList at 0x73bdbf30a100, file \"<input>\", line 6>)",
                "comment": ""
              },
              {
                "addr": "28",
                "op": "MAKE_FUNCTION",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "30",
                "op": "LOAD_CONST",
                "operands": "3 ('LinkedList')",
                "comment": ""
              },
              {
                "addr": "32",
                "op": "CALL",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "40",
                "op": "STORE_NAME",
                "operands": "1 (LinkedList)",
                "comment": ""
              },
              {
                "addr": "42",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "44",
                "op": "LOAD_NAME",
                "operands": "1 (LinkedList)",
                "comment": ""
              },
              {
                "addr": "46",
                "op": "CALL",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "54",
                "op": "STORE_NAME",
                "operands": "2 (ll)",
                "comment": ""
              },
              {
                "addr": "56",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "58",
                "op": "LOAD_NAME",
                "operands": "3 (range)",
                "comment": ""
              },
              {
                "addr": "60",
                "op": "LOAD_CONST",
                "operands": "4 (10)",
                "comment": ""
              },
              {
                "addr": "62",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "70",
                "op": "GET_ITER",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "76",
                "op": "STORE_NAME",
                "operands": "4 (i)",
                "comment": ""
              },
              {
                "addr": "78",
                "op": "LOAD_NAME",
                "operands": "2 (ll)",
                "comment": ""
              },
              {
                "addr": "80",
                "op": "LOAD_ATTR",
                "operands": "11 (NULL|self + push)",
                "comment": ""
              },
              {
                "addr": "100",
                "op": "LOAD_NAME",
                "operands": "4 (i)",
                "comment": ""
              },
              {
                "addr": "102",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "110",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "112",
                "op": "JUMP_BACKWARD",
                "operands": "21 (to 72)",
                "comment": ""
              },
              {
                "addr": "116",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "118",
                "op": "LOAD_NAME",
                "operands": "6 (print)",
                "comment": ""
              },
              {
                "addr": "120",
                "op": "LOAD_CONST",
                "operands": "5 ('Before reverse: ')",
                "comment": ""
              },
              {
                "addr": "122",
                "op": "LOAD_NAME",
                "operands": "2 (ll)",
                "comment": ""
              },
              {
                "addr": "124",
                "op": "LOAD_ATTR",
                "operands": "15 (NULL|self + to_list)",
                "comment": ""
              },
              {
                "addr": "144",
                "op": "CALL",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "152",
                "op": "FORMAT_VALUE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "154",
                "op": "BUILD_STRING",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "156",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "164",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "166",
                "op": "LOAD_NAME",
                "operands": "2 (ll)",
                "comment": ""
              },
              {
                "addr": "168",
                "op": "LOAD_ATTR",
                "operands": "17 (NULL|self + reverse)",
                "comment": ""
              },
              {
                "addr": "188",
                "op": "CALL",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "196",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "198",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "200",
                "op": "LOAD_NAME",
                "operands": "6 (print)",
                "comment": ""
              },
              {
                "addr": "202",
                "op": "LOAD_CONST",
                "operands": "6 ('After reverse: ')",
                "comment": ""
              },
              {
                "addr": "204",
                "op": "LOAD_NAME",
                "operands": "2 (ll)",
                "comment": ""
              },
              {
                "addr": "206",
                "op": "LOAD_ATTR",
                "operands": "15 (NULL|self + to_list)",
                "comment": ""
              },
              {
                "addr": "226",
                "op": "CALL",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "234",
                "op": "FORMAT_VALUE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "236",
                "op": "BUILD_STRING",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "238",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "246",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "248",
                "op": "LOAD_NAME",
                "operands": "2 (ll)",
                "comment": ""
              },
              {
                "addr": "250",
                "op": "LOAD_ATTR",
                "operands": "19 (NULL|self + pop)",
                "comment": ""
              },
              {
                "addr": "270",
                "op": "CALL",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "278",
                "op": "STORE_NAME",
                "operands": "10 (popped)",
                "comment": ""
              },
              {
                "addr": "280",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "282",
                "op": "LOAD_NAME",
                "operands": "6 (print)",
                "comment": ""
              },
              {
                "addr": "284",
                "op": "LOAD_CONST",
                "operands": "7 ('Popped: ')",
                "comment": ""
              },
              {
                "addr": "286",
                "op": "LOAD_NAME",
                "operands": "10 (popped)",
                "comment": ""
              },
              {
                "addr": "288",
                "op": "FORMAT_VALUE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "290",
                "op": "LOAD_CONST",
                "operands": "8 (', Size: ')",
                "comment": ""
              },
              {
                "addr": "292",
                "op": "LOAD_NAME",
                "operands": "2 (ll)",
                "comment": ""
              },
              {
                "addr": "294",
                "op": "LOAD_ATTR",
                "operands": "22 (size)",
                "comment": ""
              },
              {
                "addr": "314",
                "op": "FORMAT_VALUE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "316",
                "op": "BUILD_STRING",
                "operands": "4",
                "comment": ""
              },
              {
                "addr": "318",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "326",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "328",
                "op": "RETURN_CONST",
                "operands": "9 (None)",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object Node at 0x73bdbf4fe4f0, file \"<input>\", line 1>",
            "instructions": [
              {
                "addr": "0",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "LOAD_NAME",
                "operands": "0 (__name__)",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "STORE_NAME",
                "operands": "1 (__module__)",
                "comment": ""
              },
              {
                "addr": "6",
                "op": "LOAD_CONST",
                "operands": "0 ('Node')",
                "comment": ""
              },
              {
                "addr": "8",
                "op": "STORE_NAME",
                "operands": "2 (__qualname__)",
                "comment": ""
              },
              {
                "addr": "10",
                "op": "LOAD_CONST",
                "operands": "3 ((None,))",
                "comment": ""
              },
              {
                "addr": "12",
                "op": "LOAD_CONST",
                "operands": "2 (<code object __init__ at 0x73bdbf4feb10, file \"<input>\", line 2>)",
                "comment": ""
              },
              {
                "addr": "14",
                "op": "MAKE_FUNCTION",
                "operands": "1 (defaults)",
                "comment": ""
              },
              {
                "addr": "16",
                "op": "STORE_NAME",
                "operands": "3 (__init__)",
                "comment": ""
              },
              {
                "addr": "18",
                "op": "RETURN_CONST",
                "operands": "1 (None)",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object __init__ at 0x73bdbf4feb10, file \"<input>\", line 2>",
            "instructions": [
              {
                "addr": "0",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "LOAD_FAST",
                "operands": "1 (value)",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "LOAD_FAST",
                "operands": "0 (self)",
                "comment": ""
              },
              {
                "addr": "6",
                "op": "STORE_ATTR",
                "operands": "0 (value)",
                "comment": ""
              },
              {
                "addr": "16",
                "op": "LOAD_FAST",
                "operands": "2 (next_node)",
                "comment": ""
              },
              {
                "addr": "18",
                "op": "LOAD_FAST",
                "operands": "0 (self)",
                "comment": ""
              },
              {
                "addr": "20",
                "op": "STORE_ATTR",
                "operands": "1 (next)",
                "comment": ""
              },
              {
                "addr": "30",
                "op": "RETURN_CONST",
                "operands": "0 (None)",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object LinkedList at 0x73bdbf30a100, file \"<input>\", line 6>",
            "instructions": [
              {
                "addr": "0",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "LOAD_NAME",
                "operands": "0 (__name__)",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "STORE_NAME",
                "operands": "1 (__module__)",
                "comment": ""
              },
              {
                "addr": "6",
                "op": "LOAD_CONST",
                "operands": "0 ('LinkedList')",
                "comment": ""
              },
              {
                "addr": "8",
                "op": "STORE_NAME",
                "operands": "2 (__qualname__)",
                "comment": ""
              },
              {
                "addr": "10",
                "op": "LOAD_CONST",
                "operands": "1 (<code object __init__ at 0x73bdbf4fe950, file \"<input>\", line 7>)",
                "comment": ""
              },
              {
                "addr": "12",
                "op": "MAKE_FUNCTION",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "14",
                "op": "STORE_NAME",
                "operands": "3 (__init__)",
                "comment": ""
              },
              {
                "addr": "16",
                "op": "LOAD_CONST",
                "operands": "2 (<code object push at 0x73bdbf5cb930, file \"<input>\", line 11>)",
                "comment": ""
              },
              {
                "addr": "18",
                "op": "MAKE_FUNCTION",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "20",
                "op": "STORE_NAME",
                "operands": "4 (push)",
                "comment": ""
              },
              {
                "addr": "22",
                "op": "LOAD_CONST",
                "operands": "3 (<code object pop at 0x73bdbf582d30, file \"<input>\", line 15>)",
                "comment": ""
              },
              {
                "addr": "24",
                "op": "MAKE_FUNCTION",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "26",
                "op": "STORE_NAME",
                "operands": "5 (pop)",
                "comment": ""
              },
              {
                "addr": "28",
                "op": "LOAD_CONST",
                "operands": "4 (<code object reverse at 0x73bdbf334c10, file \"<input>\", line 23>)",
                "comment": ""
              },
              {
                "addr": "30",
                "op": "MAKE_FUNCTION",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "32",
                "op": "STORE_NAME",
                "operands": "6 (reverse)",
                "comment": ""
              },
              {
                "addr": "34",
                "op": "LOAD_CONST",
                "operands": "5 (<code object to_list at 0x73bdbf4b4030, file \"<input>\", line 33>)",
                "comment": ""
              },
              {
                "addr": "36",
                "op": "MAKE_FUNCTION",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "38",
                "op": "STORE_NAME",
                "operands": "7 (to_list)",
                "comment": ""
              },
              {
                "addr": "40",
                "op": "RETURN_CONST",
                "operands": "6 (None)",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object __init__ at 0x73bdbf4fe950, file \"<input>\", line 7>",
            "instructions": [
              {
                "addr": "0",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "LOAD_CONST",
                "operands": "0 (None)",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "LOAD_FAST",
                "operands": "0 (self)",
                "comment": ""
              },
              {
                "addr": "6",
                "op": "STORE_ATTR",
                "operands": "0 (head)",
                "comment": ""
              },
              {
                "addr": "16",
                "op": "LOAD_CONST",
                "operands": "1 (0)",
                "comment": ""
              },
              {
                "addr": "18",
                "op": "LOAD_FAST",
                "operands": "0 (self)",
                "comment": ""
              },
              {
                "addr": "20",
                "op": "STORE_ATTR",
                "operands": "1 (size)",
                "comment": ""
              },
              {
                "addr": "30",
                "op": "RETURN_CONST",
                "operands": "0 (None)",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object push at 0x73bdbf5cb930, file \"<input>\", line 11>",
            "instructions": [
              {
                "addr": "0",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "LOAD_GLOBAL",
                "operands": "1 (NULL + Node)",
                "comment": ""
              },
              {
                "addr": "12",
                "op": "LOAD_FAST",
                "operands": "1 (value)",
                "comment": ""
              },
              {
                "addr": "14",
                "op": "LOAD_FAST",
                "operands": "0 (self)",
                "comment": ""
              },
              {
                "addr": "16",
                "op": "LOAD_ATTR",
                "operands": "2 (head)",
                "comment": ""
              },
              {
                "addr": "36",
                "op": "CALL",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "44",
                "op": "LOAD_FAST",
                "operands": "0 (self)",
                "comment": ""
              },
              {
                "addr": "46",
                "op": "STORE_ATTR",
                "operands": "1 (head)",
                "comment": ""
              },
              {
                "addr": "56",
                "op": "LOAD_FAST",
                "operands": "0 (self)",
                "comment": ""
              },
              {
                "addr": "58",
                "op": "COPY",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "60",
                "op": "LOAD_ATTR",
                "operands": "4 (size)",
                "comment": ""
              },
              {
                "addr": "80",
                "op": "LOAD_CONST",
                "operands": "1 (1)",
                "comment": ""
              },
              {
                "addr": "82",
                "op": "BINARY_OP",
                "operands": "13 (+=)",
                "comment": ""
              },
              {
                "addr": "86",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "88",
                "op": "STORE_ATTR",
                "operands": "2 (size)",
                "comment": ""
              },
              {
                "addr": "98",
                "op": "RETURN_CONST",
                "operands": "0 (None)",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object pop at 0x73bdbf582d30, file \"<input>\", line 15>",
            "instructions": [
              {
                "addr": "0",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "LOAD_FAST",
                "operands": "0 (self)",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "LOAD_ATTR",
                "operands": "0 (head)",
                "comment": ""
              },
              {
                "addr": "24",
                "op": "POP_JUMP_IF_NOT_NONE",
                "operands": "11 (to 48)",
                "comment": ""
              },
              {
                "addr": "26",
                "op": "LOAD_GLOBAL",
                "operands": "3 (NULL + IndexError)",
                "comment": ""
              },
              {
                "addr": "36",
                "op": "LOAD_CONST",
                "operands": "1 ('pop from empty list')",
                "comment": ""
              },
              {
                "addr": "38",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "46",
                "op": "RAISE_VARARGS",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "50",
                "op": "LOAD_ATTR",
                "operands": "0 (head)",
                "comment": ""
              },
              {
                "addr": "70",
                "op": "LOAD_ATTR",
                "operands": "4 (value)",
                "comment": ""
              },
              {
                "addr": "90",
                "op": "STORE_FAST",
                "operands": "1 (value)",
                "comment": ""
              },
              {
                "addr": "92",
                "op": "LOAD_FAST",
                "operands": "0 (self)",
                "comment": ""
              },
              {
                "addr": "94",
                "op": "LOAD_ATTR",
                "operands": "0 (head)",
                "comment": ""
              },
              {
                "addr": "114",
                "op": "LOAD_ATTR",
                "operands": "6 (next)",
                "comment": ""
              },
              {
                "addr": "134",
                "op": "LOAD_FAST",
                "operands": "0 (self)",
                "comment": ""
              },
              {
                "addr": "136",
                "op": "STORE_ATTR",
                "operands": "0 (head)",
                "comment": ""
              },
              {
                "addr": "146",
                "op": "LOAD_FAST",
                "operands": "0 (self)",
                "comment": ""
              },
              {
                "addr": "148",
                "op": "COPY",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "150",
                "op": "LOAD_ATTR",
                "operands": "8 (size)",
                "comment": ""
              },
              {
                "addr": "170",
                "op": "LOAD_CONST",
                "operands": "2 (1)",
                "comment": ""
              },
              {
                "addr": "172",
                "op": "BINARY_OP",
                "operands": "23 (-=)",
                "comment": ""
              },
              {
                "addr": "176",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "178",
                "op": "STORE_ATTR",
                "operands": "4 (size)",
                "comment": ""
              },
              {
                "addr": "188",
                "op": "LOAD_FAST",
                "operands": "1 (value)",
                "comment": ""
              },
              {
                "addr": "190",
                "op": "RETURN_VALUE",
                "operands": "",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object reverse at 0x73bdbf334c10, file \"<input>\", line 23>",
            "instructions": [
              {
                "addr": "0",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "LOAD_CONST",
                "operands": "0 (None)",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "STORE_FAST",
                "operands": "1 (prev)",
                "comment": ""
              },
              {
                "addr": "6",
                "op": "LOAD_FAST",
                "operands": "0 (self)",
                "comment": ""
              },
              {
                "addr": "8",
                "op": "LOAD_ATTR",
                "operands": "0 (head)",
                "comment": ""
              },
              {
                "addr": "28",
                "op": "STORE_FAST",
                "operands": "2 (current)",
                "comment": ""
              },
              {
                "addr": "30",
                "op": "LOAD_FAST",
                "operands": "2 (current)",
                "comment": ""
              },
              {
                "addr": "32",
                "op": "POP_JUMP_IF_FALSE",
                "operands": "26 (to 86)",
                "comment": ""
              },
              {
                "addr": "36",
                "op": "LOAD_ATTR",
                "operands": "2 (next)",
                "comment": ""
              },
              {
                "addr": "56",
                "op": "STORE_FAST",
                "operands": "3 (next_node)",
                "comment": ""
              },
              {
                "addr": "58",
                "op": "LOAD_FAST",
                "operands": "1 (prev)",
                "comment": ""
              },
              {
                "addr": "60",
                "op": "LOAD_FAST",
                "operands": "2 (current)",
                "comment": ""
              },
              {
                "addr": "62",
                "op": "STORE_ATTR",
                "operands": "1 (next)",
                "comment": ""
              },
              {
                "addr": "72",
                "op": "LOAD_FAST",
                "operands": "2 (current)",
                "comment": ""
              },
              {
                "addr": "74",
                "op": "STORE_FAST",
                "operands": "1 (prev)",
                "comment": ""
              },
              {
                "addr": "76",
                "op": "LOAD_FAST",
                "operands": "3 (next_node)",
                "comment": ""
              },
              {
                "addr": "78",
                "op": "STORE_FAST",
                "operands": "2 (current)",
                "comment": ""
              },
              {
                "addr": "80",
                "op": "LOAD_FAST",
                "operands": "2 (current)",
                "comment": ""
              },
              {
                "addr": "82",
                "op": "POP_JUMP_IF_FALSE",
                "operands": "1 (to 86)",
                "comment": ""
              },
              {
                "addr": "84",
                "op": "JUMP_BACKWARD",
                "operands": "26 (to 34)",
                "comment": ""
              },
              {
                "addr": "88",
                "op": "LOAD_FAST",
                "operands": "0 (self)",
                "comment": ""
              },
              {
                "addr": "90",
                "op": "STORE_ATTR",
                "operands": "0 (head)",
                "comment": ""
              },
              {
                "addr": "100",
                "op": "RETURN_CONST",
                "operands": "0 (None)",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object to_list at 0x73bdbf4b4030, file \"<input>\", line 33>",
            "instructions": [
              {
                "addr": "0",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "BUILD_LIST",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "STORE_FAST",
                "operands": "1 (result)",
                "comment": ""
              },
              {
                "addr": "6",
                "op": "LOAD_FAST",
                "operands": "0 (self)",
                "comment": ""
              },
              {
                "addr": "8",
                "op": "LOAD_ATTR",
                "operands": "0 (head)",
                "comment": ""
              },
              {
                "addr": "28",
                "op": "STORE_FAST",
                "operands": "2 (node)",
                "comment": ""
              },
              {
                "addr": "30",
                "op": "LOAD_FAST",
                "operands": "2 (node)",
                "comment": ""
              },
              {
                "addr": "32",
                "op": "POP_JUMP_IF_FALSE",
                "operands": "42 (to 118)",
                "comment": ""
              },
              {
                "addr": "36",
                "op": "LOAD_ATTR",
                "operands": "3 (NULL|self + append)",
                "comment": ""
              },
              {
                "addr": "56",
                "op": "LOAD_FAST",
                "operands": "2 (node)",
                "comment": ""
              },
              {
                "addr": "58",
                "op": "LOAD_ATTR",
                "operands": "4 (value)",
                "comment": ""
              },
              {
                "addr": "78",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "86",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "88",
                "op": "LOAD_FAST",
                "operands": "2 (node)",
                "comment": ""
              },
              {
                "addr": "90",
                "op": "LOAD_ATTR",
                "operands": "6 (next)",
                "comment": ""
              },
              {
                "addr": "110",
                "op": "STORE_FAST",
                "operands": "2 (node)",
                "comment": ""
              },
              {
                "addr": "112",
                "op": "LOAD_FAST",
                "operands": "2 (node)",
                "comment": ""
              },
              {
                "addr": "114",
                "op": "POP_JUMP_IF_FALSE",
                "operands": "1 (to 118)",
                "comment": ""
              },
              {
                "addr": "116",
                "op": "JUMP_BACKWARD",
                "operands": "42 (to 34)",
                "comment": ""
              },
              {
                "addr": "120",
                "op": "RETURN_VALUE",
                "operands": "",
                "comment": ""
              }
            ]
          }
        ],
        "notes": "Python bytecode via dis module."
      },
      "debugger": {
        "steps": [
          {
            "line": 41,
            "description": "Assign ll = LinkedList()",
            "registers": {
              "ll": "LinkedList()"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 42,
            "description": "Loop iteration 1 over range(10)",
            "registers": {
              "ll": "LinkedList()",
              "i": "0"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 43,
            "description": "  ll.push(i)",
            "registers": {
              "ll": "LinkedList()",
              "i": "0"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 42,
            "description": "Loop iteration 2 over range(10)",
            "registers": {
              "ll": "LinkedList()",
              "i": "1"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 43,
            "description": "  ll.push(i)",
            "registers": {
              "ll": "LinkedList()",
              "i": "1"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 42,
            "description": "Loop iteration 3 over range(10)",
            "registers": {
              "ll": "LinkedList()",
              "i": "2"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 43,
            "description": "  ll.push(i)",
            "registers": {
              "ll": "LinkedList()",
              "i": "2"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 44,
            "description": "Call to_list",
            "registers": {
              "ll": "LinkedList()",
              "i": "2"
            },
            "stack": [
              "<module>",
              "to_list()"
            ]
          },
          {
            "line": 34,
            "description": "  result = []",
            "registers": {
              "ll": "LinkedList()",
              "i": "2"
            },
            "stack": [
              "<module>",
              "to_list()"
            ]
          },
          {
            "line": 35,
            "description": "  node = self.head",
            "registers": {
              "ll": "LinkedList()",
              "i": "2"
            },
            "stack": [
              "<module>",
              "to_list()"
            ]
          },
          {
            "line": 36,
            "description": "  while node:",
            "registers": {
              "ll": "LinkedList()",
              "i": "2"
            },
            "stack": [
              "<module>",
              "to_list()"
            ]
          },
          {
            "line": 37,
            "description": "  result.append(node.value)",
            "registers": {
              "ll": "LinkedList()",
              "i": "2"
            },
            "stack": [
              "<module>",
              "to_list()"
            ]
          },
          {
            "line": 38,
            "description": "  node = node.next",
            "registers": {
              "ll": "LinkedList()",
              "i": "2"
            },
            "stack": [
              "<module>",
              "to_list()"
            ]
          },
          {
            "line": 39,
            "description": "  return result",
            "registers": {
              "ll": "LinkedList()",
              "i": "2"
            },
            "stack": [
              "<module>",
              "to_list()"
            ]
          },
          {
            "line": 39,
            "description": "Return from to_list",
            "registers": {
              "ll": "LinkedList()",
              "i": "2"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 45,
            "description": "Call reverse",
            "registers": {
              "ll": "LinkedList()",
              "i": "2"
            },
            "stack": [
              "<module>",
              "reverse()"
            ]
          },
          {
            "line": 24,
            "description": "  prev = None",
            "registers": {
              "ll": "LinkedList()",
              "i": "2"
            },
            "stack": [
              "<module>",
              "reverse()"
            ]
          },
          {
            "line": 25,
            "description": "  current = self.head",
            "registers": {
              "ll": "LinkedList()",
              "i": "2"
            },
            "stack": [
              "<module>",
              "reverse()"
            ]
          },
          {
            "line": 26,
            "description": "  while current:",
            "registers": {
              "ll": "LinkedList()",
              "i": "2"
            },
            "stack": [
              "<module>",
              "reverse()"
            ]
          },
          {
            "line": 27,
            "description": "  next_node = current.next",
            "registers": {
              "ll": "LinkedList()",
              "i": "2"
            },
            "stack": [
              "<module>",
              "reverse()"
            ]
          },
          {
            "line": 28,
            "description": "  current.next = prev",
            "registers": {
              "ll": "LinkedList()",
              "i": "2"
            },
            "stack": [
              "<module>",
              "reverse()"
            ]
          },
          {
            "line": 29,
            "description": "  prev = current",
            "registers": {
              "ll": "LinkedList()",
              "i": "2"
            },
            "stack": [
              "<module>",
              "reverse()"
            ]
          },
          {
            "line": 30,
            "description": "  current = next_node",
            "registers": {
              "ll": "LinkedList()",
              "i": "2"
            },
            "stack": [
              "<module>",
              "reverse()"
            ]
          },
          {
            "line": 31,
            "description": "  self.head = prev",
            "registers": {
              "ll": "LinkedList()",
              "i": "2"
            },
            "stack": [
              "<module>",
              "reverse()"
            ]
          },
          {
            "line": 31,
            "description": "Return from reverse",
            "registers": {
              "ll": "LinkedList()",
              "i": "2"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 46,
            "description": "Call to_list",
            "registers": {
              "ll": "LinkedList()",
              "i": "2"
            },
            "stack": [
              "<module>",
              "to_list()"
            ]
          },
          {
            "line": 34,
            "description": "  result = []",
            "registers": {
              "ll": "LinkedList()",
              "i": "2"
            },
            "stack": [
              "<module>",
              "to_list()"
            ]
          },
          {
            "line": 35,
            "description": "  node = self.head",
            "registers": {
              "ll": "LinkedList()",
              "i": "2"
            },
            "stack": [
              "<module>",
              "to_list()"
            ]
          },
          {
            "line": 36,
            "description": "  while node:",
            "registers": {
              "ll": "LinkedList()",
              "i": "2"
            },
            "stack": [
              "<module>",
              "to_list()"
            ]
          },
          {
            "line": 37,
            "description": "  result.append(node.value)",
            "registers": {
              "ll": "LinkedList()",
              "i": "2"
            },
            "stack": [
              "<module>",
              "to_list()"
            ]
          },
          {
            "line": 38,
            "description": "  node = node.next",
            "registers": {
              "ll": "LinkedList()",
              "i": "2"
            },
            "stack": [
              "<module>",
              "to_list()"
            ]
          },
          {
            "line": 39,
            "description": "  return result",
            "registers": {
              "ll": "LinkedList()",
              "i": "2"
            },
            "stack": [
              "<module>",
              "to_list()"
            ]
          },
          {
            "line": 39,
            "description": "Return from to_list",
            "registers": {
              "ll": "LinkedList()",
              "i": "2"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 47,
            "description": "Assign popped = ll.pop()",
            "registers": {
              "popped": "ll.pop()",
              "ll": "LinkedList()",
              "i": "2"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 48,
            "description": "print(f\"Popped: {popped}, Size: {ll.size}\")",
            "registers": {
              "popped": "ll.pop()",
              "ll": "LinkedList()",
              "i": "2"
            },
            "stack": [
              "<module>"
            ]
          }
        ]
      },
      "compare": {
        "comparisons": []
      }
    }
  },
  {
    "id": "py-generator-pipeline",
    "title": "Generator Pipeline",
    "description": "Lazy evaluation with chained generators and memory efficiency",
    "language": "python",
    "code": "import itertools\n\ndef read_sensor_data(count):\n    \"\"\"Simulate sensor readings.\"\"\"\n    import random\n    for i in range(count):\n        yield {\"id\": i, \"temp\": random.uniform(18.0, 35.0), \"humidity\": random.uniform(30, 90)}\n\ndef filter_anomalies(stream, temp_threshold=30.0):\n    for reading in stream:\n        if reading[\"temp\"] > temp_threshold:\n            yield reading\n\ndef enrich(stream):\n    for reading in stream:\n        reading[\"alert\"] = reading[\"temp\"] > 32.0\n        reading[\"temp\"] = round(reading[\"temp\"], 1)\n        reading[\"humidity\"] = round(reading[\"humidity\"], 1)\n        yield reading\n\ndef batch(stream, size=5):\n    batch = []\n    for item in stream:\n        batch.append(item)\n        if len(batch) == size:\n            yield batch\n            batch = []\n    if batch:\n        yield batch\n\npipeline = batch(enrich(filter_anomalies(read_sensor_data(1000))))\nfor chunk in itertools.islice(pipeline, 3):\n    print(f\"Batch of {len(chunk)}: temps={[r['temp'] for r in chunk]}\")",
    "analysis": {
      "language": "python",
      "execution": {
        "instructions": [
          {
            "op": "CALL",
            "detail": "call read_sensor_data(count)",
            "cycles": 100
          },
          {
            "op": "LOAD",
            "detail": "load param count",
            "cycles": 1
          },
          {
            "op": "STORE",
            "detail": "store return of read_sensor_data",
            "cycles": 1
          },
          {
            "op": "CALL",
            "detail": "call filter_anomalies(stream, temp_threshold)",
            "cycles": 100
          },
          {
            "op": "LOAD",
            "detail": "load param stream",
            "cycles": 1
          },
          {
            "op": "LOAD",
            "detail": "load param temp_threshold",
            "cycles": 1
          },
          {
            "op": "STORE",
            "detail": "store return of filter_anomalies",
            "cycles": 1
          },
          {
            "op": "CALL",
            "detail": "call enrich(stream)",
            "cycles": 100
          },
          {
            "op": "LOAD",
            "detail": "load param stream",
            "cycles": 1
          },
          {
            "op": "STORE",
            "detail": "store return of enrich",
            "cycles": 1
          },
          {
            "op": "CALL",
            "detail": "call batch(stream, size)",
            "cycles": 100
          },
          {
            "op": "LOAD",
            "detail": "load param stream",
            "cycles": 1
          },
          {
            "op": "LOAD",
            "detail": "load param size",
            "cycles": 1
          },
          {
            "op": "STORE",
            "detail": "store return of batch",
            "cycles": 1
          },
          {
            "op": "LOOP_START",
            "detail": "for loop ~100 iterations (lines 6-7)",
            "cycles": 8
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "CMP",
            "detail": "loop condition x100",
            "cycles": 500
          },
          {
            "op": "LOOP_END",
            "detail": "end for loop",
            "cycles": 0
          },
          {
            "op": "LOOP_START",
            "detail": "for loop ~100 iterations (lines 10-12)",
            "cycles": 8
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "CMP",
            "detail": "loop condition x100",
            "cycles": 500
          },
          {
            "op": "LOOP_END",
            "detail": "end for loop",
            "cycles": 0
          },
          {
            "op": "LOOP_START",
            "detail": "for loop ~100 iterations (lines 15-19)",
            "cycles": 8
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "CMP",
            "detail": "loop condition x100",
            "cycles": 500
          },
          {
            "op": "LOOP_END",
            "detail": "end for loop",
            "cycles": 0
          },
          {
            "op": "LOOP_START",
            "detail": "for loop ~100 iterations (lines 23-27)",
            "cycles": 8
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "CMP",
            "detail": "loop condition x100",
            "cycles": 500
          },
          {
            "op": "LOOP_END",
            "detail": "end for loop",
            "cycles": 0
          },
          {
            "op": "LOOP_START",
            "detail": "for loop ~100 iterations (lines 32-33)",
            "cycles": 8
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "CMP",
            "detail": "loop condition x100",
            "cycles": 500
          },
          {
            "op": "LOOP_END",
            "detail": "end for loop",
            "cycles": 0
          },
          {
            "op": "ALLOC",
            "detail": "allocate list (Heap) — list with 0 elements",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate list (Heap) — list with 0 elements",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate dict (Heap) — dict with 3 entries",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~29 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~2 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~4 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~8 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~4 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~5 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~4 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~4 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~4 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~8 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~8 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~58 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~4 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate list_comprehension (Heap) — list comprehension (size depends on input)",
            "cycles": 20
          }
        ],
        "maxCycles": 9590,
        "summary": "55 pseudo-instructions, 9590 estimated cycles (4 functions, 5 loops, 17 allocations)"
      },
      "cost": {
        "lines": [
          {
            "line": 3,
            "cost": 50,
            "label": "~50 cycles"
          },
          {
            "line": 4,
            "cost": 20,
            "label": "~20 cycles"
          },
          {
            "line": 6,
            "cost": 8,
            "label": "~8 cycles"
          },
          {
            "line": 7,
            "cost": 580,
            "label": "~580 cycles"
          },
          {
            "line": 9,
            "cost": 50,
            "label": "~50 cycles"
          },
          {
            "line": 10,
            "cost": 8,
            "label": "~8 cycles"
          },
          {
            "line": 11,
            "cost": 520,
            "label": "~520 cycles"
          },
          {
            "line": 12,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 14,
            "cost": 50,
            "label": "~50 cycles"
          },
          {
            "line": 15,
            "cost": 8,
            "label": "~8 cycles"
          },
          {
            "line": 16,
            "cost": 540,
            "label": "~540 cycles"
          },
          {
            "line": 17,
            "cost": 540,
            "label": "~540 cycles"
          },
          {
            "line": 18,
            "cost": 540,
            "label": "~540 cycles"
          },
          {
            "line": 19,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 21,
            "cost": 50,
            "label": "~50 cycles"
          },
          {
            "line": 22,
            "cost": 20,
            "label": "~20 cycles"
          },
          {
            "line": 23,
            "cost": 8,
            "label": "~8 cycles"
          },
          {
            "line": 24,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 25,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 26,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 27,
            "cost": 520,
            "label": "~520 cycles"
          },
          {
            "line": 32,
            "cost": 8,
            "label": "~8 cycles"
          },
          {
            "line": 33,
            "cost": 560,
            "label": "~560 cycles"
          }
        ],
        "maxCost": 580,
        "insights": "Line 7 is the hottest at ~580 estimated cycles. 4 function(s), 5 loop(s), 17 allocation(s) contribute to the total cost."
      },
      "memory": {
        "allocations": [
          {
            "type": "heap",
            "name": "list",
            "detail": "list with 0 elements",
            "size": "~56 B"
          },
          {
            "type": "heap",
            "name": "list",
            "detail": "list with 0 elements",
            "size": "~56 B"
          },
          {
            "type": "heap",
            "name": "dict",
            "detail": "dict with 3 entries",
            "size": "~232 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~29 chars",
            "size": "~78 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~2 chars",
            "size": "~51 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~4 chars",
            "size": "~53 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~8 chars",
            "size": "~57 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~4 chars",
            "size": "~53 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~5 chars",
            "size": "~54 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~4 chars",
            "size": "~53 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~4 chars",
            "size": "~53 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~4 chars",
            "size": "~53 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~8 chars",
            "size": "~57 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~8 chars",
            "size": "~57 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~58 chars",
            "size": "~107 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~4 chars",
            "size": "~53 B"
          },
          {
            "type": "heap",
            "name": "list_comprehension",
            "detail": "list comprehension (size depends on input)",
            "size": "~dynamic B"
          }
        ],
        "stackTotal": "0 B",
        "heapTotal": "1.1 KB",
        "allocCount": 17,
        "notes": "17 heap allocations totaling ~1.1 KB Largest: dict with 3 entries (~232 B). Warning: heavy heap usage detected."
      },
      "concurrency": {
        "threads": [
          {
            "name": "main",
            "events": []
          }
        ],
        "warnings": [],
        "analysis": "No concurrency issues detected."
      },
      "assembly": {
        "arch": "cpython-bytecode",
        "blocks": [
          {
            "label": "module",
            "instructions": [
              {
                "addr": "0",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "LOAD_CONST",
                "operands": "0 (0)",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "LOAD_CONST",
                "operands": "1 (None)",
                "comment": ""
              },
              {
                "addr": "6",
                "op": "IMPORT_NAME",
                "operands": "0 (itertools)",
                "comment": ""
              },
              {
                "addr": "8",
                "op": "STORE_NAME",
                "operands": "0 (itertools)",
                "comment": ""
              },
              {
                "addr": "10",
                "op": "LOAD_CONST",
                "operands": "2 (<code object read_sensor_data at 0x75161fa08960, file \"<input>\", line 3>)",
                "comment": ""
              },
              {
                "addr": "12",
                "op": "MAKE_FUNCTION",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "14",
                "op": "STORE_NAME",
                "operands": "1 (read_sensor_data)",
                "comment": ""
              },
              {
                "addr": "16",
                "op": "LOAD_CONST",
                "operands": "11 ((30.0,))",
                "comment": ""
              },
              {
                "addr": "18",
                "op": "LOAD_CONST",
                "operands": "3 (<code object filter_anomalies at 0x75161fa2d030, file \"<input>\", line 9>)",
                "comment": ""
              },
              {
                "addr": "20",
                "op": "MAKE_FUNCTION",
                "operands": "1 (defaults)",
                "comment": ""
              },
              {
                "addr": "22",
                "op": "STORE_NAME",
                "operands": "2 (filter_anomalies)",
                "comment": ""
              },
              {
                "addr": "24",
                "op": "LOAD_CONST",
                "operands": "4 (<code object enrich at 0x75161fbb8030, file \"<input>\", line 14>)",
                "comment": ""
              },
              {
                "addr": "26",
                "op": "MAKE_FUNCTION",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "28",
                "op": "STORE_NAME",
                "operands": "3 (enrich)",
                "comment": ""
              },
              {
                "addr": "30",
                "op": "LOAD_CONST",
                "operands": "12 ((5,))",
                "comment": ""
              },
              {
                "addr": "32",
                "op": "LOAD_CONST",
                "operands": "5 (<code object batch at 0x75161fbb97f0, file \"<input>\", line 21>)",
                "comment": ""
              },
              {
                "addr": "34",
                "op": "MAKE_FUNCTION",
                "operands": "1 (defaults)",
                "comment": ""
              },
              {
                "addr": "36",
                "op": "STORE_NAME",
                "operands": "4 (batch)",
                "comment": ""
              },
              {
                "addr": "38",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "40",
                "op": "LOAD_NAME",
                "operands": "4 (batch)",
                "comment": ""
              },
              {
                "addr": "42",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "44",
                "op": "LOAD_NAME",
                "operands": "3 (enrich)",
                "comment": ""
              },
              {
                "addr": "46",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "48",
                "op": "LOAD_NAME",
                "operands": "2 (filter_anomalies)",
                "comment": ""
              },
              {
                "addr": "50",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "52",
                "op": "LOAD_NAME",
                "operands": "1 (read_sensor_data)",
                "comment": ""
              },
              {
                "addr": "54",
                "op": "LOAD_CONST",
                "operands": "6 (1000)",
                "comment": ""
              },
              {
                "addr": "56",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "64",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "72",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "80",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "88",
                "op": "STORE_NAME",
                "operands": "5 (pipeline)",
                "comment": ""
              },
              {
                "addr": "90",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "92",
                "op": "LOAD_NAME",
                "operands": "0 (itertools)",
                "comment": ""
              },
              {
                "addr": "94",
                "op": "LOAD_ATTR",
                "operands": "12 (islice)",
                "comment": ""
              },
              {
                "addr": "114",
                "op": "LOAD_NAME",
                "operands": "5 (pipeline)",
                "comment": ""
              },
              {
                "addr": "116",
                "op": "LOAD_CONST",
                "operands": "7 (3)",
                "comment": ""
              },
              {
                "addr": "118",
                "op": "CALL",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "126",
                "op": "GET_ITER",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "132",
                "op": "STORE_NAME",
                "operands": "7 (chunk)",
                "comment": ""
              },
              {
                "addr": "134",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "136",
                "op": "LOAD_NAME",
                "operands": "8 (print)",
                "comment": ""
              },
              {
                "addr": "138",
                "op": "LOAD_CONST",
                "operands": "8 ('Batch of ')",
                "comment": ""
              },
              {
                "addr": "140",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "142",
                "op": "LOAD_NAME",
                "operands": "9 (len)",
                "comment": ""
              },
              {
                "addr": "144",
                "op": "LOAD_NAME",
                "operands": "7 (chunk)",
                "comment": ""
              },
              {
                "addr": "146",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "154",
                "op": "FORMAT_VALUE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "156",
                "op": "LOAD_CONST",
                "operands": "9 (': temps=')",
                "comment": ""
              },
              {
                "addr": "158",
                "op": "LOAD_NAME",
                "operands": "7 (chunk)",
                "comment": ""
              },
              {
                "addr": "160",
                "op": "GET_ITER",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "162",
                "op": "LOAD_FAST_AND_CLEAR",
                "operands": "0 (r)",
                "comment": ""
              },
              {
                "addr": "164",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "166",
                "op": "BUILD_LIST",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "168",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "174",
                "op": "STORE_FAST",
                "operands": "0 (r)",
                "comment": ""
              },
              {
                "addr": "176",
                "op": "LOAD_FAST",
                "operands": "0 (r)",
                "comment": ""
              },
              {
                "addr": "178",
                "op": "LOAD_CONST",
                "operands": "10 ('temp')",
                "comment": ""
              },
              {
                "addr": "180",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "184",
                "op": "LIST_APPEND",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "186",
                "op": "JUMP_BACKWARD",
                "operands": "9 (to 170)",
                "comment": ""
              },
              {
                "addr": "190",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "192",
                "op": "STORE_FAST",
                "operands": "0 (r)",
                "comment": ""
              },
              {
                "addr": "194",
                "op": "FORMAT_VALUE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "196",
                "op": "BUILD_STRING",
                "operands": "4",
                "comment": ""
              },
              {
                "addr": "198",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "206",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "208",
                "op": "JUMP_BACKWARD",
                "operands": "41 (to 128)",
                "comment": ""
              },
              {
                "addr": "212",
                "op": "RETURN_CONST",
                "operands": "1 (None)",
                "comment": ""
              },
              {
                "addr": "216",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "218",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "220",
                "op": "STORE_FAST",
                "operands": "0 (r)",
                "comment": ""
              },
              {
                "addr": "222",
                "op": "RERAISE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "166",
                "op": "to",
                "operands": "188 -> 214 [8]",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object read_sensor_data at 0x75161fa08960, file \"<input>\", line 3>",
            "instructions": [
              {
                "addr": "0",
                "op": "RETURN_GENERATOR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "6",
                "op": "LOAD_CONST",
                "operands": "1 (0)",
                "comment": ""
              },
              {
                "addr": "8",
                "op": "LOAD_CONST",
                "operands": "2 (None)",
                "comment": ""
              },
              {
                "addr": "10",
                "op": "IMPORT_NAME",
                "operands": "0 (random)",
                "comment": ""
              },
              {
                "addr": "12",
                "op": "STORE_FAST",
                "operands": "1 (random)",
                "comment": ""
              },
              {
                "addr": "14",
                "op": "LOAD_GLOBAL",
                "operands": "3 (NULL + range)",
                "comment": ""
              },
              {
                "addr": "24",
                "op": "LOAD_FAST",
                "operands": "0 (count)",
                "comment": ""
              },
              {
                "addr": "26",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "34",
                "op": "GET_ITER",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "40",
                "op": "STORE_FAST",
                "operands": "2 (i)",
                "comment": ""
              },
              {
                "addr": "42",
                "op": "LOAD_FAST",
                "operands": "2 (i)",
                "comment": ""
              },
              {
                "addr": "44",
                "op": "LOAD_FAST",
                "operands": "1 (random)",
                "comment": ""
              },
              {
                "addr": "46",
                "op": "LOAD_ATTR",
                "operands": "5 (NULL|self + uniform)",
                "comment": ""
              },
              {
                "addr": "66",
                "op": "LOAD_CONST",
                "operands": "3 (18.0)",
                "comment": ""
              },
              {
                "addr": "68",
                "op": "LOAD_CONST",
                "operands": "4 (35.0)",
                "comment": ""
              },
              {
                "addr": "70",
                "op": "CALL",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "78",
                "op": "LOAD_FAST",
                "operands": "1 (random)",
                "comment": ""
              },
              {
                "addr": "80",
                "op": "LOAD_ATTR",
                "operands": "5 (NULL|self + uniform)",
                "comment": ""
              },
              {
                "addr": "100",
                "op": "LOAD_CONST",
                "operands": "5 (30)",
                "comment": ""
              },
              {
                "addr": "102",
                "op": "LOAD_CONST",
                "operands": "6 (90)",
                "comment": ""
              },
              {
                "addr": "104",
                "op": "CALL",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "112",
                "op": "LOAD_CONST",
                "operands": "7 (('id', 'temp', 'humidity'))",
                "comment": ""
              },
              {
                "addr": "114",
                "op": "BUILD_CONST_KEY_MAP",
                "operands": "3",
                "comment": ""
              },
              {
                "addr": "116",
                "op": "YIELD_VALUE",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "118",
                "op": "RESUME",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "120",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "122",
                "op": "JUMP_BACKWARD",
                "operands": "44 (to 36)",
                "comment": ""
              },
              {
                "addr": "126",
                "op": "RETURN_CONST",
                "operands": "2 (None)",
                "comment": ""
              },
              {
                "addr": "130",
                "op": "RERAISE",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "to",
                "operands": "126 -> 128 [0] lasti",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object filter_anomalies at 0x75161fa2d030, file \"<input>\", line 9>",
            "instructions": [
              {
                "addr": "0",
                "op": "RETURN_GENERATOR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "6",
                "op": "LOAD_FAST",
                "operands": "0 (stream)",
                "comment": ""
              },
              {
                "addr": "8",
                "op": "GET_ITER",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "14",
                "op": "STORE_FAST",
                "operands": "2 (reading)",
                "comment": ""
              },
              {
                "addr": "16",
                "op": "LOAD_FAST",
                "operands": "2 (reading)",
                "comment": ""
              },
              {
                "addr": "18",
                "op": "LOAD_CONST",
                "operands": "1 ('temp')",
                "comment": ""
              },
              {
                "addr": "20",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "24",
                "op": "LOAD_FAST",
                "operands": "1 (temp_threshold)",
                "comment": ""
              },
              {
                "addr": "26",
                "op": "COMPARE_OP",
                "operands": "68 (>)",
                "comment": ""
              },
              {
                "addr": "30",
                "op": "POP_JUMP_IF_TRUE",
                "operands": "1 (to 34)",
                "comment": ""
              },
              {
                "addr": "32",
                "op": "JUMP_BACKWARD",
                "operands": "12 (to 10)",
                "comment": ""
              },
              {
                "addr": "36",
                "op": "YIELD_VALUE",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "38",
                "op": "RESUME",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "40",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "42",
                "op": "JUMP_BACKWARD",
                "operands": "17 (to 10)",
                "comment": ""
              },
              {
                "addr": "46",
                "op": "RETURN_CONST",
                "operands": "0 (None)",
                "comment": ""
              },
              {
                "addr": "50",
                "op": "RERAISE",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "to",
                "operands": "30 -> 48 [0] lasti",
                "comment": ""
              },
              {
                "addr": "34",
                "op": "to",
                "operands": "46 -> 48 [0] lasti",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object enrich at 0x75161fbb8030, file \"<input>\", line 14>",
            "instructions": [
              {
                "addr": "0",
                "op": "RETURN_GENERATOR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "6",
                "op": "LOAD_FAST",
                "operands": "0 (stream)",
                "comment": ""
              },
              {
                "addr": "8",
                "op": "GET_ITER",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "14",
                "op": "STORE_FAST",
                "operands": "1 (reading)",
                "comment": ""
              },
              {
                "addr": "16",
                "op": "LOAD_FAST",
                "operands": "1 (reading)",
                "comment": ""
              },
              {
                "addr": "18",
                "op": "LOAD_CONST",
                "operands": "1 ('temp')",
                "comment": ""
              },
              {
                "addr": "20",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "24",
                "op": "LOAD_CONST",
                "operands": "2 (32.0)",
                "comment": ""
              },
              {
                "addr": "26",
                "op": "COMPARE_OP",
                "operands": "68 (>)",
                "comment": ""
              },
              {
                "addr": "30",
                "op": "LOAD_FAST",
                "operands": "1 (reading)",
                "comment": ""
              },
              {
                "addr": "32",
                "op": "LOAD_CONST",
                "operands": "3 ('alert')",
                "comment": ""
              },
              {
                "addr": "34",
                "op": "STORE_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "38",
                "op": "LOAD_GLOBAL",
                "operands": "1 (NULL + round)",
                "comment": ""
              },
              {
                "addr": "48",
                "op": "LOAD_FAST",
                "operands": "1 (reading)",
                "comment": ""
              },
              {
                "addr": "50",
                "op": "LOAD_CONST",
                "operands": "1 ('temp')",
                "comment": ""
              },
              {
                "addr": "52",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "56",
                "op": "LOAD_CONST",
                "operands": "4 (1)",
                "comment": ""
              },
              {
                "addr": "58",
                "op": "CALL",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "66",
                "op": "LOAD_FAST",
                "operands": "1 (reading)",
                "comment": ""
              },
              {
                "addr": "68",
                "op": "LOAD_CONST",
                "operands": "1 ('temp')",
                "comment": ""
              },
              {
                "addr": "70",
                "op": "STORE_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "74",
                "op": "LOAD_GLOBAL",
                "operands": "1 (NULL + round)",
                "comment": ""
              },
              {
                "addr": "84",
                "op": "LOAD_FAST",
                "operands": "1 (reading)",
                "comment": ""
              },
              {
                "addr": "86",
                "op": "LOAD_CONST",
                "operands": "5 ('humidity')",
                "comment": ""
              },
              {
                "addr": "88",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "92",
                "op": "LOAD_CONST",
                "operands": "4 (1)",
                "comment": ""
              },
              {
                "addr": "94",
                "op": "CALL",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "102",
                "op": "LOAD_FAST",
                "operands": "1 (reading)",
                "comment": ""
              },
              {
                "addr": "104",
                "op": "LOAD_CONST",
                "operands": "5 ('humidity')",
                "comment": ""
              },
              {
                "addr": "106",
                "op": "STORE_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "110",
                "op": "LOAD_FAST",
                "operands": "1 (reading)",
                "comment": ""
              },
              {
                "addr": "112",
                "op": "YIELD_VALUE",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "114",
                "op": "RESUME",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "116",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "118",
                "op": "JUMP_BACKWARD",
                "operands": "55 (to 10)",
                "comment": ""
              },
              {
                "addr": "122",
                "op": "RETURN_CONST",
                "operands": "0 (None)",
                "comment": ""
              },
              {
                "addr": "126",
                "op": "RERAISE",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "to",
                "operands": "122 -> 124 [0] lasti",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object batch at 0x75161fbb97f0, file \"<input>\", line 21>",
            "instructions": [
              {
                "addr": "0",
                "op": "RETURN_GENERATOR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "6",
                "op": "BUILD_LIST",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "8",
                "op": "STORE_FAST",
                "operands": "2 (batch)",
                "comment": ""
              },
              {
                "addr": "10",
                "op": "LOAD_FAST",
                "operands": "0 (stream)",
                "comment": ""
              },
              {
                "addr": "12",
                "op": "GET_ITER",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "18",
                "op": "STORE_FAST",
                "operands": "3 (item)",
                "comment": ""
              },
              {
                "addr": "20",
                "op": "LOAD_FAST",
                "operands": "2 (batch)",
                "comment": ""
              },
              {
                "addr": "22",
                "op": "LOAD_ATTR",
                "operands": "1 (NULL|self + append)",
                "comment": ""
              },
              {
                "addr": "42",
                "op": "LOAD_FAST",
                "operands": "3 (item)",
                "comment": ""
              },
              {
                "addr": "44",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "52",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "54",
                "op": "LOAD_GLOBAL",
                "operands": "3 (NULL + len)",
                "comment": ""
              },
              {
                "addr": "64",
                "op": "LOAD_FAST",
                "operands": "2 (batch)",
                "comment": ""
              },
              {
                "addr": "66",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "74",
                "op": "LOAD_FAST",
                "operands": "1 (size)",
                "comment": ""
              },
              {
                "addr": "76",
                "op": "COMPARE_OP",
                "operands": "40 (==)",
                "comment": ""
              },
              {
                "addr": "80",
                "op": "POP_JUMP_IF_TRUE",
                "operands": "1 (to 84)",
                "comment": ""
              },
              {
                "addr": "82",
                "op": "JUMP_BACKWARD",
                "operands": "35 (to 14)",
                "comment": ""
              },
              {
                "addr": "86",
                "op": "YIELD_VALUE",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "88",
                "op": "RESUME",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "90",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "92",
                "op": "BUILD_LIST",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "94",
                "op": "STORE_FAST",
                "operands": "2 (batch)",
                "comment": ""
              },
              {
                "addr": "96",
                "op": "JUMP_BACKWARD",
                "operands": "42 (to 14)",
                "comment": ""
              },
              {
                "addr": "100",
                "op": "LOAD_FAST",
                "operands": "2 (batch)",
                "comment": ""
              },
              {
                "addr": "102",
                "op": "POP_JUMP_IF_FALSE",
                "operands": "5 (to 114)",
                "comment": ""
              },
              {
                "addr": "104",
                "op": "LOAD_FAST",
                "operands": "2 (batch)",
                "comment": ""
              },
              {
                "addr": "106",
                "op": "YIELD_VALUE",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "108",
                "op": "RESUME",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "110",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "112",
                "op": "RETURN_CONST",
                "operands": "0 (None)",
                "comment": ""
              },
              {
                "addr": "118",
                "op": "RERAISE",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "to",
                "operands": "80 -> 116 [0] lasti",
                "comment": ""
              },
              {
                "addr": "84",
                "op": "to",
                "operands": "114 -> 116 [0] lasti",
                "comment": ""
              }
            ]
          }
        ],
        "notes": "Python bytecode via dis module."
      },
      "debugger": {
        "steps": [
          {
            "line": 1,
            "description": "import itertools",
            "registers": {},
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 31,
            "description": "Assign pipeline = batch(enrich(filter_anomalies(read_senso...",
            "registers": {
              "pipeline": "batch(enrich(filter_anomalies(read_senso..."
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 32,
            "description": "Loop iteration 1 over itertools.islice(pipeline, 3)",
            "registers": {
              "chunk": "0",
              "pipeline": "batch(enrich(filter_anomalies(read_senso..."
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 33,
            "description": "  print(f\"Batch of {len(chunk)}: temps={[r['temp'] for r in chunk]}\")",
            "registers": {
              "chunk": "0",
              "pipeline": "batch(enrich(filter_anomalies(read_senso..."
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 32,
            "description": "Loop iteration 2 over itertools.islice(pipeline, 3)",
            "registers": {
              "chunk": "1",
              "pipeline": "batch(enrich(filter_anomalies(read_senso..."
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 33,
            "description": "  print(f\"Batch of {len(chunk)}: temps={[r['temp'] for r in chunk]}\")",
            "registers": {
              "chunk": "1",
              "pipeline": "batch(enrich(filter_anomalies(read_senso..."
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 32,
            "description": "Loop iteration 3 over itertools.islice(pipeline, 3)",
            "registers": {
              "chunk": "2",
              "pipeline": "batch(enrich(filter_anomalies(read_senso..."
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 33,
            "description": "  print(f\"Batch of {len(chunk)}: temps={[r['temp'] for r in chunk]}\")",
            "registers": {
              "chunk": "2",
              "pipeline": "batch(enrich(filter_anomalies(read_senso..."
            },
            "stack": [
              "<module>"
            ]
          }
        ]
      },
      "compare": {
        "comparisons": [
          {
            "title": "For Loop + Append vs List Comprehension",
            "patterns": [
              {
                "label": "Current: for loop with append",
                "code": "    for item in stream:\n        batch.append(item)\n        if len(batch) == size:\n            yield batch\n            batch = []",
                "cycles": "~N * (loop_overhead + append_cost)",
                "memory": "Two allocations: list + loop",
                "notes": "Slower due to method call overhead per iteration"
              },
              {
                "label": "Alternative: list comprehension",
                "code": "[expr for x in iterable]",
                "cycles": "~N * expr_cost (optimized C loop internally)",
                "memory": "Single allocation, pre-sized",
                "notes": "~30-50% faster for simple transformations"
              }
            ],
            "winner": "List comprehension — fewer method calls, C-level loop"
          }
        ]
      }
    }
  },
  {
    "id": "py-binary-search",
    "title": "Binary Search Variants",
    "description": "Iterative vs recursive search with edge cases",
    "language": "python",
    "code": "from typing import Optional\n\ndef binary_search_iterative(arr: list[int], target: int) -> Optional[int]:\n    low, high = 0, len(arr) - 1\n    while low <= high:\n        mid = low + (high - low) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return None\n\ndef binary_search_recursive(arr: list[int], target: int, low: int = 0, high: int = -1) -> Optional[int]:\n    if high == -1:\n        high = len(arr) - 1\n    if low > high:\n        return None\n    mid = low + (high - low) // 2\n    if arr[mid] == target:\n        return mid\n    elif arr[mid] < target:\n        return binary_search_recursive(arr, target, mid + 1, high)\n    else:\n        return binary_search_recursive(arr, target, low, mid - 1)\n\ndef bisect_left(arr: list[int], target: int) -> int:\n    low, high = 0, len(arr)\n    while low < high:\n        mid = (low + high) // 2\n        if arr[mid] < target:\n            low = mid + 1\n        else:\n            high = mid\n    return low\n\ndata = list(range(0, 100, 2))\nprint(f\"Iterative find 42: index={binary_search_iterative(data, 42)}\")\nprint(f\"Recursive find 42: index={binary_search_recursive(data, 42)}\")\nprint(f\"Bisect left for 43: insert_at={bisect_left(data, 43)}\")\nprint(f\"Iterative find 43: index={binary_search_iterative(data, 43)}\")",
    "analysis": {
      "language": "python",
      "execution": {
        "instructions": [
          {
            "op": "CALL",
            "detail": "call binary_search_iterative()",
            "cycles": 100
          },
          {
            "op": "STORE",
            "detail": "store return of binary_search_iterative",
            "cycles": 1
          },
          {
            "op": "CALL",
            "detail": "call binary_search_recursive(low, high)",
            "cycles": 100
          },
          {
            "op": "LOAD",
            "detail": "load param low",
            "cycles": 1
          },
          {
            "op": "LOAD",
            "detail": "load param high",
            "cycles": 1
          },
          {
            "op": "STORE",
            "detail": "store return of binary_search_recursive",
            "cycles": 1
          },
          {
            "op": "CALL",
            "detail": "call bisect_left()",
            "cycles": 100
          },
          {
            "op": "STORE",
            "detail": "store return of bisect_left",
            "cycles": 1
          },
          {
            "op": "LOOP_START",
            "detail": "while loop ~100 iterations (lines 5-12)",
            "cycles": 8
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "CMP",
            "detail": "loop condition x100",
            "cycles": 500
          },
          {
            "op": "LOOP_END",
            "detail": "end while loop",
            "cycles": 0
          },
          {
            "op": "LOOP_START",
            "detail": "while loop ~100 iterations (lines 30-35)",
            "cycles": 8
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "CMP",
            "detail": "loop condition x100",
            "cycles": 500
          },
          {
            "op": "LOOP_END",
            "detail": "end while loop",
            "cycles": 0
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~61 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~61 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~54 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~61 chars",
            "cycles": 20
          }
        ],
        "maxCycles": 4201,
        "summary": "22 pseudo-instructions, 4201 estimated cycles (3 functions, 2 loops, 4 allocations)"
      },
      "cost": {
        "lines": [
          {
            "line": 3,
            "cost": 50,
            "label": "~50 cycles"
          },
          {
            "line": 5,
            "cost": 8,
            "label": "~8 cycles"
          },
          {
            "line": 6,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 7,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 8,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 9,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 10,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 11,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 12,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 15,
            "cost": 50,
            "label": "~50 cycles"
          },
          {
            "line": 28,
            "cost": 50,
            "label": "~50 cycles"
          },
          {
            "line": 30,
            "cost": 8,
            "label": "~8 cycles"
          },
          {
            "line": 31,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 32,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 33,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 34,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 35,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 39,
            "cost": 20,
            "label": "~20 cycles"
          },
          {
            "line": 40,
            "cost": 20,
            "label": "~20 cycles"
          },
          {
            "line": 41,
            "cost": 20,
            "label": "~20 cycles"
          },
          {
            "line": 42,
            "cost": 20,
            "label": "~20 cycles"
          }
        ],
        "maxCost": 500,
        "insights": "Line 35 is the hottest at ~500 estimated cycles. 3 function(s), 2 loop(s), 4 allocation(s) contribute to the total cost."
      },
      "memory": {
        "allocations": [
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~61 chars",
            "size": "~110 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~61 chars",
            "size": "~110 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~54 chars",
            "size": "~103 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~61 chars",
            "size": "~110 B"
          }
        ],
        "stackTotal": "0 B",
        "heapTotal": "433 B",
        "allocCount": 4,
        "notes": "4 heap allocations totaling ~433 B Largest: string of ~61 chars (~110 B)."
      },
      "concurrency": {
        "threads": [
          {
            "name": "main",
            "events": []
          }
        ],
        "warnings": [],
        "analysis": "No concurrency issues detected."
      },
      "assembly": {
        "arch": "cpython-bytecode",
        "blocks": [
          {
            "label": "module",
            "instructions": [
              {
                "addr": "0",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "LOAD_CONST",
                "operands": "0 (0)",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "LOAD_CONST",
                "operands": "1 (('Optional',))",
                "comment": ""
              },
              {
                "addr": "6",
                "op": "IMPORT_NAME",
                "operands": "0 (typing)",
                "comment": ""
              },
              {
                "addr": "8",
                "op": "IMPORT_FROM",
                "operands": "1 (Optional)",
                "comment": ""
              },
              {
                "addr": "10",
                "op": "STORE_NAME",
                "operands": "1 (Optional)",
                "comment": ""
              },
              {
                "addr": "12",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "14",
                "op": "LOAD_CONST",
                "operands": "2 ('arr')",
                "comment": ""
              },
              {
                "addr": "16",
                "op": "LOAD_NAME",
                "operands": "2 (list)",
                "comment": ""
              },
              {
                "addr": "18",
                "op": "LOAD_NAME",
                "operands": "3 (int)",
                "comment": ""
              },
              {
                "addr": "20",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "24",
                "op": "LOAD_CONST",
                "operands": "3 ('target')",
                "comment": ""
              },
              {
                "addr": "26",
                "op": "LOAD_NAME",
                "operands": "3 (int)",
                "comment": ""
              },
              {
                "addr": "28",
                "op": "LOAD_CONST",
                "operands": "4 ('return')",
                "comment": ""
              },
              {
                "addr": "30",
                "op": "LOAD_NAME",
                "operands": "1 (Optional)",
                "comment": ""
              },
              {
                "addr": "32",
                "op": "LOAD_NAME",
                "operands": "3 (int)",
                "comment": ""
              },
              {
                "addr": "34",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "38",
                "op": "BUILD_TUPLE",
                "operands": "6",
                "comment": ""
              },
              {
                "addr": "40",
                "op": "LOAD_CONST",
                "operands": "5 (<code object binary_search_iterative at 0x751c2f208960, file \"<input>\", line 3>)",
                "comment": ""
              },
              {
                "addr": "42",
                "op": "MAKE_FUNCTION",
                "operands": "4 (annotations)",
                "comment": ""
              },
              {
                "addr": "44",
                "op": "STORE_NAME",
                "operands": "4 (binary_search_iterative)",
                "comment": ""
              },
              {
                "addr": "46",
                "op": "LOAD_CONST",
                "operands": "19 ((0, -1))",
                "comment": ""
              },
              {
                "addr": "48",
                "op": "LOAD_CONST",
                "operands": "2 ('arr')",
                "comment": ""
              },
              {
                "addr": "50",
                "op": "LOAD_NAME",
                "operands": "2 (list)",
                "comment": ""
              },
              {
                "addr": "52",
                "op": "LOAD_NAME",
                "operands": "3 (int)",
                "comment": ""
              },
              {
                "addr": "54",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "58",
                "op": "LOAD_CONST",
                "operands": "3 ('target')",
                "comment": ""
              },
              {
                "addr": "60",
                "op": "LOAD_NAME",
                "operands": "3 (int)",
                "comment": ""
              },
              {
                "addr": "62",
                "op": "LOAD_CONST",
                "operands": "6 ('low')",
                "comment": ""
              },
              {
                "addr": "64",
                "op": "LOAD_NAME",
                "operands": "3 (int)",
                "comment": ""
              },
              {
                "addr": "66",
                "op": "LOAD_CONST",
                "operands": "7 ('high')",
                "comment": ""
              },
              {
                "addr": "68",
                "op": "LOAD_NAME",
                "operands": "3 (int)",
                "comment": ""
              },
              {
                "addr": "70",
                "op": "LOAD_CONST",
                "operands": "4 ('return')",
                "comment": ""
              },
              {
                "addr": "72",
                "op": "LOAD_NAME",
                "operands": "1 (Optional)",
                "comment": ""
              },
              {
                "addr": "74",
                "op": "LOAD_NAME",
                "operands": "3 (int)",
                "comment": ""
              },
              {
                "addr": "76",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "80",
                "op": "BUILD_TUPLE",
                "operands": "10",
                "comment": ""
              },
              {
                "addr": "82",
                "op": "LOAD_CONST",
                "operands": "8 (<code object binary_search_recursive at 0x751c2fc9ad30, file \"<input>\", line 15>)",
                "comment": ""
              },
              {
                "addr": "84",
                "op": "MAKE_FUNCTION",
                "operands": "5 (defaults, annotations)",
                "comment": ""
              },
              {
                "addr": "86",
                "op": "STORE_NAME",
                "operands": "5 (binary_search_recursive)",
                "comment": ""
              },
              {
                "addr": "88",
                "op": "LOAD_CONST",
                "operands": "2 ('arr')",
                "comment": ""
              },
              {
                "addr": "90",
                "op": "LOAD_NAME",
                "operands": "2 (list)",
                "comment": ""
              },
              {
                "addr": "92",
                "op": "LOAD_NAME",
                "operands": "3 (int)",
                "comment": ""
              },
              {
                "addr": "94",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "98",
                "op": "LOAD_CONST",
                "operands": "3 ('target')",
                "comment": ""
              },
              {
                "addr": "100",
                "op": "LOAD_NAME",
                "operands": "3 (int)",
                "comment": ""
              },
              {
                "addr": "102",
                "op": "LOAD_CONST",
                "operands": "4 ('return')",
                "comment": ""
              },
              {
                "addr": "104",
                "op": "LOAD_NAME",
                "operands": "3 (int)",
                "comment": ""
              },
              {
                "addr": "106",
                "op": "BUILD_TUPLE",
                "operands": "6",
                "comment": ""
              },
              {
                "addr": "108",
                "op": "LOAD_CONST",
                "operands": "9 (<code object bisect_left at 0x751c2fce3930, file \"<input>\", line 28>)",
                "comment": ""
              },
              {
                "addr": "110",
                "op": "MAKE_FUNCTION",
                "operands": "4 (annotations)",
                "comment": ""
              },
              {
                "addr": "112",
                "op": "STORE_NAME",
                "operands": "6 (bisect_left)",
                "comment": ""
              },
              {
                "addr": "114",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "116",
                "op": "LOAD_NAME",
                "operands": "2 (list)",
                "comment": ""
              },
              {
                "addr": "118",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "120",
                "op": "LOAD_NAME",
                "operands": "7 (range)",
                "comment": ""
              },
              {
                "addr": "122",
                "op": "LOAD_CONST",
                "operands": "0 (0)",
                "comment": ""
              },
              {
                "addr": "124",
                "op": "LOAD_CONST",
                "operands": "10 (100)",
                "comment": ""
              },
              {
                "addr": "126",
                "op": "LOAD_CONST",
                "operands": "11 (2)",
                "comment": ""
              },
              {
                "addr": "128",
                "op": "CALL",
                "operands": "3",
                "comment": ""
              },
              {
                "addr": "136",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "144",
                "op": "STORE_NAME",
                "operands": "8 (data)",
                "comment": ""
              },
              {
                "addr": "146",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "148",
                "op": "LOAD_NAME",
                "operands": "9 (print)",
                "comment": ""
              },
              {
                "addr": "150",
                "op": "LOAD_CONST",
                "operands": "12 ('Iterative find 42: index=')",
                "comment": ""
              },
              {
                "addr": "152",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "154",
                "op": "LOAD_NAME",
                "operands": "4 (binary_search_iterative)",
                "comment": ""
              },
              {
                "addr": "156",
                "op": "LOAD_NAME",
                "operands": "8 (data)",
                "comment": ""
              },
              {
                "addr": "158",
                "op": "LOAD_CONST",
                "operands": "13 (42)",
                "comment": ""
              },
              {
                "addr": "160",
                "op": "CALL",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "168",
                "op": "FORMAT_VALUE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "170",
                "op": "BUILD_STRING",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "172",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "180",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "182",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "184",
                "op": "LOAD_NAME",
                "operands": "9 (print)",
                "comment": ""
              },
              {
                "addr": "186",
                "op": "LOAD_CONST",
                "operands": "14 ('Recursive find 42: index=')",
                "comment": ""
              },
              {
                "addr": "188",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "190",
                "op": "LOAD_NAME",
                "operands": "5 (binary_search_recursive)",
                "comment": ""
              },
              {
                "addr": "192",
                "op": "LOAD_NAME",
                "operands": "8 (data)",
                "comment": ""
              },
              {
                "addr": "194",
                "op": "LOAD_CONST",
                "operands": "13 (42)",
                "comment": ""
              },
              {
                "addr": "196",
                "op": "CALL",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "204",
                "op": "FORMAT_VALUE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "206",
                "op": "BUILD_STRING",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "208",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "216",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "218",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "220",
                "op": "LOAD_NAME",
                "operands": "9 (print)",
                "comment": ""
              },
              {
                "addr": "222",
                "op": "LOAD_CONST",
                "operands": "15 ('Bisect left for 43: insert_at=')",
                "comment": ""
              },
              {
                "addr": "224",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "226",
                "op": "LOAD_NAME",
                "operands": "6 (bisect_left)",
                "comment": ""
              },
              {
                "addr": "228",
                "op": "LOAD_NAME",
                "operands": "8 (data)",
                "comment": ""
              },
              {
                "addr": "230",
                "op": "LOAD_CONST",
                "operands": "16 (43)",
                "comment": ""
              },
              {
                "addr": "232",
                "op": "CALL",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "240",
                "op": "FORMAT_VALUE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "242",
                "op": "BUILD_STRING",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "244",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "252",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "254",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "256",
                "op": "LOAD_NAME",
                "operands": "9 (print)",
                "comment": ""
              },
              {
                "addr": "258",
                "op": "LOAD_CONST",
                "operands": "17 ('Iterative find 43: index=')",
                "comment": ""
              },
              {
                "addr": "260",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "262",
                "op": "LOAD_NAME",
                "operands": "4 (binary_search_iterative)",
                "comment": ""
              },
              {
                "addr": "264",
                "op": "LOAD_NAME",
                "operands": "8 (data)",
                "comment": ""
              },
              {
                "addr": "266",
                "op": "LOAD_CONST",
                "operands": "16 (43)",
                "comment": ""
              },
              {
                "addr": "268",
                "op": "CALL",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "276",
                "op": "FORMAT_VALUE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "278",
                "op": "BUILD_STRING",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "280",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "288",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "290",
                "op": "RETURN_CONST",
                "operands": "18 (None)",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object binary_search_iterative at 0x751c2f208960, file \"<input>\", line 3>",
            "instructions": [
              {
                "addr": "0",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "LOAD_CONST",
                "operands": "1 (0)",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "LOAD_GLOBAL",
                "operands": "1 (NULL + len)",
                "comment": ""
              },
              {
                "addr": "14",
                "op": "LOAD_FAST",
                "operands": "0 (arr)",
                "comment": ""
              },
              {
                "addr": "16",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "24",
                "op": "LOAD_CONST",
                "operands": "2 (1)",
                "comment": ""
              },
              {
                "addr": "26",
                "op": "BINARY_OP",
                "operands": "10 (-)",
                "comment": ""
              },
              {
                "addr": "30",
                "op": "STORE_FAST",
                "operands": "3 (high)",
                "comment": ""
              },
              {
                "addr": "32",
                "op": "STORE_FAST",
                "operands": "2 (low)",
                "comment": ""
              },
              {
                "addr": "34",
                "op": "LOAD_FAST",
                "operands": "2 (low)",
                "comment": ""
              },
              {
                "addr": "36",
                "op": "LOAD_FAST",
                "operands": "3 (high)",
                "comment": ""
              },
              {
                "addr": "38",
                "op": "COMPARE_OP",
                "operands": "26 (<=)",
                "comment": ""
              },
              {
                "addr": "42",
                "op": "POP_JUMP_IF_FALSE",
                "operands": "46 (to 136)",
                "comment": ""
              },
              {
                "addr": "46",
                "op": "LOAD_FAST",
                "operands": "3 (high)",
                "comment": ""
              },
              {
                "addr": "48",
                "op": "LOAD_FAST",
                "operands": "2 (low)",
                "comment": ""
              },
              {
                "addr": "50",
                "op": "BINARY_OP",
                "operands": "10 (-)",
                "comment": ""
              },
              {
                "addr": "54",
                "op": "LOAD_CONST",
                "operands": "3 (2)",
                "comment": ""
              },
              {
                "addr": "56",
                "op": "BINARY_OP",
                "operands": "2 (//)",
                "comment": ""
              },
              {
                "addr": "60",
                "op": "BINARY_OP",
                "operands": "0 (+)",
                "comment": ""
              },
              {
                "addr": "64",
                "op": "STORE_FAST",
                "operands": "4 (mid)",
                "comment": ""
              },
              {
                "addr": "66",
                "op": "LOAD_FAST",
                "operands": "0 (arr)",
                "comment": ""
              },
              {
                "addr": "68",
                "op": "LOAD_FAST",
                "operands": "4 (mid)",
                "comment": ""
              },
              {
                "addr": "70",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "74",
                "op": "LOAD_FAST",
                "operands": "1 (target)",
                "comment": ""
              },
              {
                "addr": "76",
                "op": "COMPARE_OP",
                "operands": "40 (==)",
                "comment": ""
              },
              {
                "addr": "80",
                "op": "POP_JUMP_IF_FALSE",
                "operands": "2 (to 86)",
                "comment": ""
              },
              {
                "addr": "82",
                "op": "LOAD_FAST",
                "operands": "4 (mid)",
                "comment": ""
              },
              {
                "addr": "84",
                "op": "RETURN_VALUE",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "88",
                "op": "LOAD_FAST",
                "operands": "4 (mid)",
                "comment": ""
              },
              {
                "addr": "90",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "94",
                "op": "LOAD_FAST",
                "operands": "1 (target)",
                "comment": ""
              },
              {
                "addr": "96",
                "op": "COMPARE_OP",
                "operands": "2 (<)",
                "comment": ""
              },
              {
                "addr": "100",
                "op": "POP_JUMP_IF_FALSE",
                "operands": "6 (to 114)",
                "comment": ""
              },
              {
                "addr": "102",
                "op": "LOAD_FAST",
                "operands": "4 (mid)",
                "comment": ""
              },
              {
                "addr": "104",
                "op": "LOAD_CONST",
                "operands": "2 (1)",
                "comment": ""
              },
              {
                "addr": "106",
                "op": "BINARY_OP",
                "operands": "0 (+)",
                "comment": ""
              },
              {
                "addr": "110",
                "op": "STORE_FAST",
                "operands": "2 (low)",
                "comment": ""
              },
              {
                "addr": "112",
                "op": "JUMP_FORWARD",
                "operands": "5 (to 124)",
                "comment": ""
              },
              {
                "addr": "116",
                "op": "LOAD_CONST",
                "operands": "2 (1)",
                "comment": ""
              },
              {
                "addr": "118",
                "op": "BINARY_OP",
                "operands": "10 (-)",
                "comment": ""
              },
              {
                "addr": "122",
                "op": "STORE_FAST",
                "operands": "3 (high)",
                "comment": ""
              },
              {
                "addr": "126",
                "op": "LOAD_FAST",
                "operands": "3 (high)",
                "comment": ""
              },
              {
                "addr": "128",
                "op": "COMPARE_OP",
                "operands": "26 (<=)",
                "comment": ""
              },
              {
                "addr": "132",
                "op": "POP_JUMP_IF_FALSE",
                "operands": "1 (to 136)",
                "comment": ""
              },
              {
                "addr": "134",
                "op": "JUMP_BACKWARD",
                "operands": "46 (to 44)",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object binary_search_recursive at 0x751c2fc9ad30, file \"<input>\", line 15>",
            "instructions": [
              {
                "addr": "0",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "LOAD_FAST",
                "operands": "3 (high)",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "LOAD_CONST",
                "operands": "1 (-1)",
                "comment": ""
              },
              {
                "addr": "6",
                "op": "COMPARE_OP",
                "operands": "40 (==)",
                "comment": ""
              },
              {
                "addr": "10",
                "op": "POP_JUMP_IF_FALSE",
                "operands": "14 (to 40)",
                "comment": ""
              },
              {
                "addr": "12",
                "op": "LOAD_GLOBAL",
                "operands": "1 (NULL + len)",
                "comment": ""
              },
              {
                "addr": "22",
                "op": "LOAD_FAST",
                "operands": "0 (arr)",
                "comment": ""
              },
              {
                "addr": "24",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "32",
                "op": "LOAD_CONST",
                "operands": "2 (1)",
                "comment": ""
              },
              {
                "addr": "34",
                "op": "BINARY_OP",
                "operands": "10 (-)",
                "comment": ""
              },
              {
                "addr": "38",
                "op": "STORE_FAST",
                "operands": "3 (high)",
                "comment": ""
              },
              {
                "addr": "42",
                "op": "LOAD_FAST",
                "operands": "3 (high)",
                "comment": ""
              },
              {
                "addr": "44",
                "op": "COMPARE_OP",
                "operands": "68 (>)",
                "comment": ""
              },
              {
                "addr": "48",
                "op": "POP_JUMP_IF_FALSE",
                "operands": "1 (to 52)",
                "comment": ""
              },
              {
                "addr": "50",
                "op": "RETURN_CONST",
                "operands": "0 (None)",
                "comment": ""
              },
              {
                "addr": "54",
                "op": "LOAD_FAST",
                "operands": "3 (high)",
                "comment": ""
              },
              {
                "addr": "56",
                "op": "LOAD_FAST",
                "operands": "2 (low)",
                "comment": ""
              },
              {
                "addr": "58",
                "op": "BINARY_OP",
                "operands": "10 (-)",
                "comment": ""
              },
              {
                "addr": "62",
                "op": "LOAD_CONST",
                "operands": "3 (2)",
                "comment": ""
              },
              {
                "addr": "64",
                "op": "BINARY_OP",
                "operands": "2 (//)",
                "comment": ""
              },
              {
                "addr": "68",
                "op": "BINARY_OP",
                "operands": "0 (+)",
                "comment": ""
              },
              {
                "addr": "72",
                "op": "STORE_FAST",
                "operands": "4 (mid)",
                "comment": ""
              },
              {
                "addr": "74",
                "op": "LOAD_FAST",
                "operands": "0 (arr)",
                "comment": ""
              },
              {
                "addr": "76",
                "op": "LOAD_FAST",
                "operands": "4 (mid)",
                "comment": ""
              },
              {
                "addr": "78",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "82",
                "op": "LOAD_FAST",
                "operands": "1 (target)",
                "comment": ""
              },
              {
                "addr": "84",
                "op": "COMPARE_OP",
                "operands": "40 (==)",
                "comment": ""
              },
              {
                "addr": "88",
                "op": "POP_JUMP_IF_FALSE",
                "operands": "2 (to 94)",
                "comment": ""
              },
              {
                "addr": "90",
                "op": "LOAD_FAST",
                "operands": "4 (mid)",
                "comment": ""
              },
              {
                "addr": "92",
                "op": "RETURN_VALUE",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "96",
                "op": "LOAD_FAST",
                "operands": "4 (mid)",
                "comment": ""
              },
              {
                "addr": "98",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "102",
                "op": "LOAD_FAST",
                "operands": "1 (target)",
                "comment": ""
              },
              {
                "addr": "104",
                "op": "COMPARE_OP",
                "operands": "2 (<)",
                "comment": ""
              },
              {
                "addr": "108",
                "op": "POP_JUMP_IF_FALSE",
                "operands": "17 (to 144)",
                "comment": ""
              },
              {
                "addr": "110",
                "op": "LOAD_GLOBAL",
                "operands": "3 (NULL + binary_search_recursive)",
                "comment": ""
              },
              {
                "addr": "120",
                "op": "LOAD_FAST",
                "operands": "0 (arr)",
                "comment": ""
              },
              {
                "addr": "122",
                "op": "LOAD_FAST",
                "operands": "1 (target)",
                "comment": ""
              },
              {
                "addr": "124",
                "op": "LOAD_FAST",
                "operands": "4 (mid)",
                "comment": ""
              },
              {
                "addr": "126",
                "op": "LOAD_CONST",
                "operands": "2 (1)",
                "comment": ""
              },
              {
                "addr": "128",
                "op": "BINARY_OP",
                "operands": "0 (+)",
                "comment": ""
              },
              {
                "addr": "132",
                "op": "LOAD_FAST",
                "operands": "3 (high)",
                "comment": ""
              },
              {
                "addr": "134",
                "op": "CALL",
                "operands": "4",
                "comment": ""
              },
              {
                "addr": "142",
                "op": "RETURN_VALUE",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "154",
                "op": "LOAD_FAST",
                "operands": "0 (arr)",
                "comment": ""
              },
              {
                "addr": "156",
                "op": "LOAD_FAST",
                "operands": "1 (target)",
                "comment": ""
              },
              {
                "addr": "158",
                "op": "LOAD_FAST",
                "operands": "2 (low)",
                "comment": ""
              },
              {
                "addr": "160",
                "op": "LOAD_FAST",
                "operands": "4 (mid)",
                "comment": ""
              },
              {
                "addr": "162",
                "op": "LOAD_CONST",
                "operands": "2 (1)",
                "comment": ""
              },
              {
                "addr": "164",
                "op": "BINARY_OP",
                "operands": "10 (-)",
                "comment": ""
              },
              {
                "addr": "168",
                "op": "CALL",
                "operands": "4",
                "comment": ""
              },
              {
                "addr": "176",
                "op": "RETURN_VALUE",
                "operands": "",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object bisect_left at 0x751c2fce3930, file \"<input>\", line 28>",
            "instructions": [
              {
                "addr": "0",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "LOAD_CONST",
                "operands": "1 (0)",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "LOAD_GLOBAL",
                "operands": "1 (NULL + len)",
                "comment": ""
              },
              {
                "addr": "14",
                "op": "LOAD_FAST",
                "operands": "0 (arr)",
                "comment": ""
              },
              {
                "addr": "16",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "24",
                "op": "STORE_FAST",
                "operands": "3 (high)",
                "comment": ""
              },
              {
                "addr": "26",
                "op": "STORE_FAST",
                "operands": "2 (low)",
                "comment": ""
              },
              {
                "addr": "28",
                "op": "LOAD_FAST",
                "operands": "2 (low)",
                "comment": ""
              },
              {
                "addr": "30",
                "op": "LOAD_FAST",
                "operands": "3 (high)",
                "comment": ""
              },
              {
                "addr": "32",
                "op": "COMPARE_OP",
                "operands": "2 (<)",
                "comment": ""
              },
              {
                "addr": "36",
                "op": "POP_JUMP_IF_FALSE",
                "operands": "30 (to 98)",
                "comment": ""
              },
              {
                "addr": "40",
                "op": "LOAD_FAST",
                "operands": "3 (high)",
                "comment": ""
              },
              {
                "addr": "42",
                "op": "BINARY_OP",
                "operands": "0 (+)",
                "comment": ""
              },
              {
                "addr": "46",
                "op": "LOAD_CONST",
                "operands": "2 (2)",
                "comment": ""
              },
              {
                "addr": "48",
                "op": "BINARY_OP",
                "operands": "2 (//)",
                "comment": ""
              },
              {
                "addr": "52",
                "op": "STORE_FAST",
                "operands": "4 (mid)",
                "comment": ""
              },
              {
                "addr": "54",
                "op": "LOAD_FAST",
                "operands": "0 (arr)",
                "comment": ""
              },
              {
                "addr": "56",
                "op": "LOAD_FAST",
                "operands": "4 (mid)",
                "comment": ""
              },
              {
                "addr": "58",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "62",
                "op": "LOAD_FAST",
                "operands": "1 (target)",
                "comment": ""
              },
              {
                "addr": "64",
                "op": "COMPARE_OP",
                "operands": "2 (<)",
                "comment": ""
              },
              {
                "addr": "68",
                "op": "POP_JUMP_IF_FALSE",
                "operands": "6 (to 82)",
                "comment": ""
              },
              {
                "addr": "70",
                "op": "LOAD_FAST",
                "operands": "4 (mid)",
                "comment": ""
              },
              {
                "addr": "72",
                "op": "LOAD_CONST",
                "operands": "3 (1)",
                "comment": ""
              },
              {
                "addr": "74",
                "op": "BINARY_OP",
                "operands": "0 (+)",
                "comment": ""
              },
              {
                "addr": "78",
                "op": "STORE_FAST",
                "operands": "2 (low)",
                "comment": ""
              },
              {
                "addr": "80",
                "op": "JUMP_FORWARD",
                "operands": "2 (to 86)",
                "comment": ""
              },
              {
                "addr": "84",
                "op": "STORE_FAST",
                "operands": "3 (high)",
                "comment": ""
              },
              {
                "addr": "88",
                "op": "LOAD_FAST",
                "operands": "3 (high)",
                "comment": ""
              },
              {
                "addr": "90",
                "op": "COMPARE_OP",
                "operands": "2 (<)",
                "comment": ""
              },
              {
                "addr": "94",
                "op": "POP_JUMP_IF_FALSE",
                "operands": "1 (to 98)",
                "comment": ""
              },
              {
                "addr": "96",
                "op": "JUMP_BACKWARD",
                "operands": "30 (to 38)",
                "comment": ""
              },
              {
                "addr": "100",
                "op": "RETURN_VALUE",
                "operands": "",
                "comment": ""
              }
            ]
          }
        ],
        "notes": "Python bytecode via dis module."
      },
      "debugger": {
        "steps": [
          {
            "line": 1,
            "description": "from typing import Optional",
            "registers": {},
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 38,
            "description": "Assign data = list(range(0, 100, 2))",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 39,
            "description": "Call binary_search_iterative",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "binary_search_iterative()"
            ]
          },
          {
            "line": 4,
            "description": "  low, high = 0, len(arr) - 1",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "binary_search_iterative()"
            ]
          },
          {
            "line": 5,
            "description": "  while low <= high:",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "binary_search_iterative()"
            ]
          },
          {
            "line": 6,
            "description": "  mid = low + (high - low) // 2",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "binary_search_iterative()"
            ]
          },
          {
            "line": 7,
            "description": "  if arr[mid] == target:",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "binary_search_iterative()"
            ]
          },
          {
            "line": 8,
            "description": "  return mid",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "binary_search_iterative()"
            ]
          },
          {
            "line": 9,
            "description": "  elif arr[mid] < target:",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "binary_search_iterative()"
            ]
          },
          {
            "line": 10,
            "description": "  low = mid + 1",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "binary_search_iterative()"
            ]
          },
          {
            "line": 11,
            "description": "  else:",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "binary_search_iterative()"
            ]
          },
          {
            "line": 12,
            "description": "  high = mid - 1",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "binary_search_iterative()"
            ]
          },
          {
            "line": 13,
            "description": "  return None",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "binary_search_iterative()"
            ]
          },
          {
            "line": 13,
            "description": "Return from binary_search_iterative",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 40,
            "description": "Call binary_search_recursive",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "binary_search_recursive()"
            ]
          },
          {
            "line": 16,
            "description": "  if high == -1:",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "binary_search_recursive()"
            ]
          },
          {
            "line": 17,
            "description": "  high = len(arr) - 1",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "binary_search_recursive()"
            ]
          },
          {
            "line": 18,
            "description": "  if low > high:",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "binary_search_recursive()"
            ]
          },
          {
            "line": 19,
            "description": "  return None",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "binary_search_recursive()"
            ]
          },
          {
            "line": 20,
            "description": "  mid = low + (high - low) // 2",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "binary_search_recursive()"
            ]
          },
          {
            "line": 21,
            "description": "  if arr[mid] == target:",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "binary_search_recursive()"
            ]
          },
          {
            "line": 22,
            "description": "  return mid",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "binary_search_recursive()"
            ]
          },
          {
            "line": 23,
            "description": "  elif arr[mid] < target:",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "binary_search_recursive()"
            ]
          },
          {
            "line": 24,
            "description": "  return binary_search_recursive(arr, target, mid + 1, high)",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "binary_search_recursive()"
            ]
          },
          {
            "line": 25,
            "description": "  else:",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "binary_search_recursive()"
            ]
          },
          {
            "line": 26,
            "description": "  return binary_search_recursive(arr, target, low, mid - 1)",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "binary_search_recursive()"
            ]
          },
          {
            "line": 26,
            "description": "Return from binary_search_recursive",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 41,
            "description": "Call bisect_left",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "bisect_left()"
            ]
          },
          {
            "line": 29,
            "description": "  low, high = 0, len(arr)",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "bisect_left()"
            ]
          },
          {
            "line": 30,
            "description": "  while low < high:",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "bisect_left()"
            ]
          },
          {
            "line": 31,
            "description": "  mid = (low + high) // 2",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "bisect_left()"
            ]
          },
          {
            "line": 32,
            "description": "  if arr[mid] < target:",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "bisect_left()"
            ]
          },
          {
            "line": 33,
            "description": "  low = mid + 1",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "bisect_left()"
            ]
          },
          {
            "line": 34,
            "description": "  else:",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "bisect_left()"
            ]
          },
          {
            "line": 35,
            "description": "  high = mid",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "bisect_left()"
            ]
          },
          {
            "line": 36,
            "description": "  return low",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "bisect_left()"
            ]
          },
          {
            "line": 36,
            "description": "Return from bisect_left",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 42,
            "description": "Call binary_search_iterative",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "binary_search_iterative()"
            ]
          },
          {
            "line": 4,
            "description": "  low, high = 0, len(arr) - 1",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "binary_search_iterative()"
            ]
          },
          {
            "line": 5,
            "description": "  while low <= high:",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "binary_search_iterative()"
            ]
          },
          {
            "line": 6,
            "description": "  mid = low + (high - low) // 2",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "binary_search_iterative()"
            ]
          },
          {
            "line": 7,
            "description": "  if arr[mid] == target:",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "binary_search_iterative()"
            ]
          },
          {
            "line": 8,
            "description": "  return mid",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "binary_search_iterative()"
            ]
          },
          {
            "line": 9,
            "description": "  elif arr[mid] < target:",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "binary_search_iterative()"
            ]
          },
          {
            "line": 10,
            "description": "  low = mid + 1",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "binary_search_iterative()"
            ]
          },
          {
            "line": 11,
            "description": "  else:",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "binary_search_iterative()"
            ]
          },
          {
            "line": 12,
            "description": "  high = mid - 1",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "binary_search_iterative()"
            ]
          },
          {
            "line": 13,
            "description": "  return None",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>",
              "binary_search_iterative()"
            ]
          },
          {
            "line": 13,
            "description": "Return from binary_search_iterative",
            "registers": {
              "data": "list(range(0, 100, 2))"
            },
            "stack": [
              "<module>"
            ]
          }
        ]
      },
      "compare": {
        "comparisons": []
      }
    }
  },
  {
    "id": "py-decorator-pattern",
    "title": "Decorator Patterns",
    "description": "Timing, retry logic, and function wrapping overhead",
    "language": "python",
    "code": "import time\nimport functools\n\ndef timer(func):\n    @functools.wraps(func)\n    def wrapper(*args, **kwargs):\n        start = time.perf_counter()\n        result = func(*args, **kwargs)\n        elapsed = time.perf_counter() - start\n        print(f\"{func.__name__} took {elapsed:.4f}s\")\n        return result\n    return wrapper\n\ndef retry(max_attempts=3, delay=0.1):\n    def decorator(func):\n        @functools.wraps(func)\n        def wrapper(*args, **kwargs):\n            last_error = None\n            for attempt in range(max_attempts):\n                try:\n                    return func(*args, **kwargs)\n                except Exception as e:\n                    last_error = e\n                    if attempt < max_attempts - 1:\n                        time.sleep(delay)\n            raise last_error\n        return wrapper\n    return decorator\n\ndef cache_result(func):\n    cache = {}\n    @functools.wraps(func)\n    def wrapper(*args):\n        if args not in cache:\n            cache[args] = func(*args)\n        return cache[args]\n    return wrapper\n\n@timer\n@cache_result\ndef expensive_compute(n):\n    total = 0\n    for i in range(n):\n        total += i ** 2\n    return total\n\n@retry(max_attempts=3, delay=0.01)\ndef flaky_operation():\n    import random\n    if random.random() < 0.7:\n        raise ConnectionError(\"Network timeout\")\n    return \"success\"\n\nresult = expensive_compute(10000)\nprint(f\"Result: {result}\")\nresult2 = expensive_compute(10000)\nprint(f\"Cached: {result2}\")",
    "analysis": {
      "language": "python",
      "execution": {
        "instructions": [
          {
            "op": "CALL",
            "detail": "call timer(func)",
            "cycles": 100
          },
          {
            "op": "LOAD",
            "detail": "load param func",
            "cycles": 1
          },
          {
            "op": "STORE",
            "detail": "store return of timer",
            "cycles": 1
          },
          {
            "op": "CALL",
            "detail": "call wrapper(*args, **kwargs)",
            "cycles": 100
          },
          {
            "op": "LOAD",
            "detail": "load param *args",
            "cycles": 1
          },
          {
            "op": "LOAD",
            "detail": "load param **kwargs",
            "cycles": 1
          },
          {
            "op": "STORE",
            "detail": "store return of wrapper",
            "cycles": 1
          },
          {
            "op": "CALL",
            "detail": "call retry(max_attempts, delay)",
            "cycles": 100
          },
          {
            "op": "LOAD",
            "detail": "load param max_attempts",
            "cycles": 1
          },
          {
            "op": "LOAD",
            "detail": "load param delay",
            "cycles": 1
          },
          {
            "op": "STORE",
            "detail": "store return of retry",
            "cycles": 1
          },
          {
            "op": "CALL",
            "detail": "call decorator(func)",
            "cycles": 100
          },
          {
            "op": "LOAD",
            "detail": "load param func",
            "cycles": 1
          },
          {
            "op": "STORE",
            "detail": "store return of decorator",
            "cycles": 1
          },
          {
            "op": "CALL",
            "detail": "call wrapper(*args, **kwargs)",
            "cycles": 100
          },
          {
            "op": "LOAD",
            "detail": "load param *args",
            "cycles": 1
          },
          {
            "op": "LOAD",
            "detail": "load param **kwargs",
            "cycles": 1
          },
          {
            "op": "STORE",
            "detail": "store return of wrapper",
            "cycles": 1
          },
          {
            "op": "CALL",
            "detail": "call cache_result(func)",
            "cycles": 100
          },
          {
            "op": "LOAD",
            "detail": "load param func",
            "cycles": 1
          },
          {
            "op": "STORE",
            "detail": "store return of cache_result",
            "cycles": 1
          },
          {
            "op": "CALL",
            "detail": "call wrapper(*args)",
            "cycles": 100
          },
          {
            "op": "LOAD",
            "detail": "load param *args",
            "cycles": 1
          },
          {
            "op": "STORE",
            "detail": "store return of wrapper",
            "cycles": 1
          },
          {
            "op": "CALL",
            "detail": "call expensive_compute(n)",
            "cycles": 100
          },
          {
            "op": "LOAD",
            "detail": "load param n",
            "cycles": 1
          },
          {
            "op": "STORE",
            "detail": "store return of expensive_compute",
            "cycles": 1
          },
          {
            "op": "CALL",
            "detail": "call flaky_operation()",
            "cycles": 100
          },
          {
            "op": "STORE",
            "detail": "store return of flaky_operation",
            "cycles": 1
          },
          {
            "op": "LOOP_START",
            "detail": "for loop ~100 iterations (lines 19-25)",
            "cycles": 8
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "CMP",
            "detail": "loop condition x100",
            "cycles": 500
          },
          {
            "op": "LOOP_END",
            "detail": "end for loop",
            "cycles": 0
          },
          {
            "op": "LOOP_START",
            "detail": "for loop ~100 iterations (lines 43-44)",
            "cycles": 8
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "CMP",
            "detail": "loop condition x100",
            "cycles": 500
          },
          {
            "op": "LOOP_END",
            "detail": "end for loop",
            "cycles": 0
          },
          {
            "op": "ALLOC",
            "detail": "allocate dict (Heap) — dict with 0 entries",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~36 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~15 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~7 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~17 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~18 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate ConnectionError (Heap) — ConnectionError instance",
            "cycles": 20
          }
        ],
        "maxCycles": 3476,
        "summary": "44 pseudo-instructions, 3476 estimated cycles (9 functions, 2 loops, 7 allocations)"
      },
      "cost": {
        "lines": [
          {
            "line": 4,
            "cost": 50,
            "label": "~50 cycles"
          },
          {
            "line": 6,
            "cost": 50,
            "label": "~50 cycles"
          },
          {
            "line": 10,
            "cost": 20,
            "label": "~20 cycles"
          },
          {
            "line": 14,
            "cost": 50,
            "label": "~50 cycles"
          },
          {
            "line": 15,
            "cost": 50,
            "label": "~50 cycles"
          },
          {
            "line": 17,
            "cost": 50,
            "label": "~50 cycles"
          },
          {
            "line": 19,
            "cost": 8,
            "label": "~8 cycles"
          },
          {
            "line": 20,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 21,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 22,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 23,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 24,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 25,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 30,
            "cost": 50,
            "label": "~50 cycles"
          },
          {
            "line": 31,
            "cost": 20,
            "label": "~20 cycles"
          },
          {
            "line": 33,
            "cost": 50,
            "label": "~50 cycles"
          },
          {
            "line": 41,
            "cost": 50,
            "label": "~50 cycles"
          },
          {
            "line": 43,
            "cost": 8,
            "label": "~8 cycles"
          },
          {
            "line": 44,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 48,
            "cost": 50,
            "label": "~50 cycles"
          },
          {
            "line": 51,
            "cost": 40,
            "label": "~40 cycles"
          },
          {
            "line": 52,
            "cost": 20,
            "label": "~20 cycles"
          },
          {
            "line": 55,
            "cost": 20,
            "label": "~20 cycles"
          },
          {
            "line": 57,
            "cost": 20,
            "label": "~20 cycles"
          }
        ],
        "maxCost": 500,
        "insights": "Line 44 is the hottest at ~500 estimated cycles. 9 function(s), 2 loop(s), 7 allocation(s) contribute to the total cost."
      },
      "memory": {
        "allocations": [
          {
            "type": "heap",
            "name": "dict",
            "detail": "dict with 0 entries",
            "size": "~64 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~36 chars",
            "size": "~85 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~15 chars",
            "size": "~64 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~7 chars",
            "size": "~56 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~17 chars",
            "size": "~66 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~18 chars",
            "size": "~67 B"
          },
          {
            "type": "heap",
            "name": "ConnectionError",
            "detail": "ConnectionError instance",
            "size": "~64+ B"
          }
        ],
        "stackTotal": "0 B",
        "heapTotal": "402 B",
        "allocCount": 7,
        "notes": "7 heap allocations totaling ~402 B Largest: string of ~36 chars (~85 B)."
      },
      "concurrency": {
        "threads": [
          {
            "name": "main",
            "events": []
          }
        ],
        "warnings": [],
        "analysis": "No concurrency issues detected."
      },
      "assembly": {
        "arch": "cpython-bytecode",
        "blocks": [
          {
            "label": "module",
            "instructions": [
              {
                "addr": "0",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "LOAD_CONST",
                "operands": "0 (0)",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "LOAD_CONST",
                "operands": "1 (None)",
                "comment": ""
              },
              {
                "addr": "6",
                "op": "IMPORT_NAME",
                "operands": "0 (time)",
                "comment": ""
              },
              {
                "addr": "8",
                "op": "STORE_NAME",
                "operands": "0 (time)",
                "comment": ""
              },
              {
                "addr": "10",
                "op": "LOAD_CONST",
                "operands": "0 (0)",
                "comment": ""
              },
              {
                "addr": "12",
                "op": "LOAD_CONST",
                "operands": "1 (None)",
                "comment": ""
              },
              {
                "addr": "14",
                "op": "IMPORT_NAME",
                "operands": "1 (functools)",
                "comment": ""
              },
              {
                "addr": "16",
                "op": "STORE_NAME",
                "operands": "1 (functools)",
                "comment": ""
              },
              {
                "addr": "18",
                "op": "LOAD_CONST",
                "operands": "2 (<code object timer at 0x7506f7221ac0, file \"<input>\", line 4>)",
                "comment": ""
              },
              {
                "addr": "20",
                "op": "MAKE_FUNCTION",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "22",
                "op": "STORE_NAME",
                "operands": "2 (timer)",
                "comment": ""
              },
              {
                "addr": "24",
                "op": "LOAD_CONST",
                "operands": "13 ((3, 0.1))",
                "comment": ""
              },
              {
                "addr": "26",
                "op": "LOAD_CONST",
                "operands": "4 (<code object retry at 0x7506f7202b10, file \"<input>\", line 14>)",
                "comment": ""
              },
              {
                "addr": "28",
                "op": "MAKE_FUNCTION",
                "operands": "1 (defaults)",
                "comment": ""
              },
              {
                "addr": "30",
                "op": "STORE_NAME",
                "operands": "3 (retry)",
                "comment": ""
              },
              {
                "addr": "32",
                "op": "LOAD_CONST",
                "operands": "5 (<code object cache_result at 0x7506f7221ce0, file \"<input>\", line 30>)",
                "comment": ""
              },
              {
                "addr": "34",
                "op": "MAKE_FUNCTION",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "36",
                "op": "STORE_NAME",
                "operands": "4 (cache_result)",
                "comment": ""
              },
              {
                "addr": "38",
                "op": "LOAD_NAME",
                "operands": "2 (timer)",
                "comment": ""
              },
              {
                "addr": "40",
                "op": "LOAD_NAME",
                "operands": "4 (cache_result)",
                "comment": ""
              },
              {
                "addr": "42",
                "op": "LOAD_CONST",
                "operands": "6 (<code object expensive_compute at 0x7506f722d030, file \"<input>\", line 39>)",
                "comment": ""
              },
              {
                "addr": "44",
                "op": "MAKE_FUNCTION",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "46",
                "op": "CALL",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "54",
                "op": "CALL",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "62",
                "op": "STORE_NAME",
                "operands": "5 (expensive_compute)",
                "comment": ""
              },
              {
                "addr": "64",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "66",
                "op": "LOAD_NAME",
                "operands": "3 (retry)",
                "comment": ""
              },
              {
                "addr": "68",
                "op": "LOAD_CONST",
                "operands": "3 (3)",
                "comment": ""
              },
              {
                "addr": "70",
                "op": "LOAD_CONST",
                "operands": "7 (0.01)",
                "comment": ""
              },
              {
                "addr": "72",
                "op": "KW_NAMES",
                "operands": "8 (('max_attempts', 'delay'))",
                "comment": ""
              },
              {
                "addr": "74",
                "op": "CALL",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "82",
                "op": "LOAD_CONST",
                "operands": "9 (<code object flaky_operation at 0x7506f7221df0, file \"<input>\", line 47>)",
                "comment": ""
              },
              {
                "addr": "84",
                "op": "MAKE_FUNCTION",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "86",
                "op": "CALL",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "94",
                "op": "STORE_NAME",
                "operands": "6 (flaky_operation)",
                "comment": ""
              },
              {
                "addr": "96",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "98",
                "op": "LOAD_NAME",
                "operands": "5 (expensive_compute)",
                "comment": ""
              },
              {
                "addr": "100",
                "op": "LOAD_CONST",
                "operands": "10 (10000)",
                "comment": ""
              },
              {
                "addr": "102",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "110",
                "op": "STORE_NAME",
                "operands": "7 (result)",
                "comment": ""
              },
              {
                "addr": "112",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "114",
                "op": "LOAD_NAME",
                "operands": "8 (print)",
                "comment": ""
              },
              {
                "addr": "116",
                "op": "LOAD_CONST",
                "operands": "11 ('Result: ')",
                "comment": ""
              },
              {
                "addr": "118",
                "op": "LOAD_NAME",
                "operands": "7 (result)",
                "comment": ""
              },
              {
                "addr": "120",
                "op": "FORMAT_VALUE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "122",
                "op": "BUILD_STRING",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "124",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "132",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "134",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "136",
                "op": "LOAD_NAME",
                "operands": "5 (expensive_compute)",
                "comment": ""
              },
              {
                "addr": "138",
                "op": "LOAD_CONST",
                "operands": "10 (10000)",
                "comment": ""
              },
              {
                "addr": "140",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "148",
                "op": "STORE_NAME",
                "operands": "9 (result2)",
                "comment": ""
              },
              {
                "addr": "150",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "152",
                "op": "LOAD_NAME",
                "operands": "8 (print)",
                "comment": ""
              },
              {
                "addr": "154",
                "op": "LOAD_CONST",
                "operands": "12 ('Cached: ')",
                "comment": ""
              },
              {
                "addr": "156",
                "op": "LOAD_NAME",
                "operands": "9 (result2)",
                "comment": ""
              },
              {
                "addr": "158",
                "op": "FORMAT_VALUE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "160",
                "op": "BUILD_STRING",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "162",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "170",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "172",
                "op": "RETURN_CONST",
                "operands": "1 (None)",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object timer at 0x7506f7221ac0, file \"<input>\", line 4>",
            "instructions": [
              {
                "addr": "0",
                "op": "MAKE_CELL",
                "operands": "0 (func)",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "LOAD_GLOBAL",
                "operands": "1 (NULL + functools)",
                "comment": ""
              },
              {
                "addr": "14",
                "op": "LOAD_ATTR",
                "operands": "2 (wraps)",
                "comment": ""
              },
              {
                "addr": "34",
                "op": "LOAD_DEREF",
                "operands": "0 (func)",
                "comment": ""
              },
              {
                "addr": "36",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "44",
                "op": "LOAD_CLOSURE",
                "operands": "0 (func)",
                "comment": ""
              },
              {
                "addr": "46",
                "op": "BUILD_TUPLE",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "48",
                "op": "LOAD_CONST",
                "operands": "1 (<code object wrapper at 0x7506f7340030, file \"<input>\", line 5>)",
                "comment": ""
              },
              {
                "addr": "50",
                "op": "MAKE_FUNCTION",
                "operands": "8 (closure)",
                "comment": ""
              },
              {
                "addr": "52",
                "op": "CALL",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "60",
                "op": "STORE_FAST",
                "operands": "1 (wrapper)",
                "comment": ""
              },
              {
                "addr": "62",
                "op": "LOAD_FAST",
                "operands": "1 (wrapper)",
                "comment": ""
              },
              {
                "addr": "64",
                "op": "RETURN_VALUE",
                "operands": "",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object wrapper at 0x7506f7340030, file \"<input>\", line 5>",
            "instructions": [
              {
                "addr": "0",
                "op": "COPY_FREE_VARS",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "LOAD_GLOBAL",
                "operands": "1 (NULL + time)",
                "comment": ""
              },
              {
                "addr": "14",
                "op": "LOAD_ATTR",
                "operands": "2 (perf_counter)",
                "comment": ""
              },
              {
                "addr": "34",
                "op": "CALL",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "42",
                "op": "STORE_FAST",
                "operands": "2 (start)",
                "comment": ""
              },
              {
                "addr": "44",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "46",
                "op": "LOAD_DEREF",
                "operands": "5 (func)",
                "comment": ""
              },
              {
                "addr": "48",
                "op": "LOAD_FAST",
                "operands": "0 (args)",
                "comment": ""
              },
              {
                "addr": "50",
                "op": "BUILD_MAP",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "52",
                "op": "LOAD_FAST",
                "operands": "1 (kwargs)",
                "comment": ""
              },
              {
                "addr": "54",
                "op": "DICT_MERGE",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "56",
                "op": "CALL_FUNCTION_EX",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "58",
                "op": "STORE_FAST",
                "operands": "3 (result)",
                "comment": ""
              },
              {
                "addr": "60",
                "op": "LOAD_GLOBAL",
                "operands": "1 (NULL + time)",
                "comment": ""
              },
              {
                "addr": "70",
                "op": "LOAD_ATTR",
                "operands": "2 (perf_counter)",
                "comment": ""
              },
              {
                "addr": "90",
                "op": "CALL",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "98",
                "op": "LOAD_FAST",
                "operands": "2 (start)",
                "comment": ""
              },
              {
                "addr": "100",
                "op": "BINARY_OP",
                "operands": "10 (-)",
                "comment": ""
              },
              {
                "addr": "104",
                "op": "STORE_FAST",
                "operands": "4 (elapsed)",
                "comment": ""
              },
              {
                "addr": "106",
                "op": "LOAD_GLOBAL",
                "operands": "5 (NULL + print)",
                "comment": ""
              },
              {
                "addr": "116",
                "op": "LOAD_DEREF",
                "operands": "5 (func)",
                "comment": ""
              },
              {
                "addr": "118",
                "op": "LOAD_ATTR",
                "operands": "6 (__name__)",
                "comment": ""
              },
              {
                "addr": "138",
                "op": "FORMAT_VALUE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "140",
                "op": "LOAD_CONST",
                "operands": "1 (' took ')",
                "comment": ""
              },
              {
                "addr": "142",
                "op": "LOAD_FAST",
                "operands": "4 (elapsed)",
                "comment": ""
              },
              {
                "addr": "144",
                "op": "LOAD_CONST",
                "operands": "2 ('.4f')",
                "comment": ""
              },
              {
                "addr": "146",
                "op": "FORMAT_VALUE",
                "operands": "4 (with format)",
                "comment": ""
              },
              {
                "addr": "148",
                "op": "LOAD_CONST",
                "operands": "3 ('s')",
                "comment": ""
              },
              {
                "addr": "150",
                "op": "BUILD_STRING",
                "operands": "4",
                "comment": ""
              },
              {
                "addr": "152",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "160",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "162",
                "op": "LOAD_FAST",
                "operands": "3 (result)",
                "comment": ""
              },
              {
                "addr": "164",
                "op": "RETURN_VALUE",
                "operands": "",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object retry at 0x7506f7202b10, file \"<input>\", line 14>",
            "instructions": [
              {
                "addr": "0",
                "op": "MAKE_CELL",
                "operands": "0 (max_attempts)",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "MAKE_CELL",
                "operands": "1 (delay)",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "6",
                "op": "LOAD_CLOSURE",
                "operands": "1 (delay)",
                "comment": ""
              },
              {
                "addr": "8",
                "op": "LOAD_CLOSURE",
                "operands": "0 (max_attempts)",
                "comment": ""
              },
              {
                "addr": "10",
                "op": "BUILD_TUPLE",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "12",
                "op": "LOAD_CONST",
                "operands": "1 (<code object decorator at 0x7506f7221bd0, file \"<input>\", line 15>)",
                "comment": ""
              },
              {
                "addr": "14",
                "op": "MAKE_FUNCTION",
                "operands": "8 (closure)",
                "comment": ""
              },
              {
                "addr": "16",
                "op": "STORE_FAST",
                "operands": "2 (decorator)",
                "comment": ""
              },
              {
                "addr": "18",
                "op": "LOAD_FAST",
                "operands": "2 (decorator)",
                "comment": ""
              },
              {
                "addr": "20",
                "op": "RETURN_VALUE",
                "operands": "",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object decorator at 0x7506f7221bd0, file \"<input>\", line 15>",
            "instructions": [
              {
                "addr": "0",
                "op": "COPY_FREE_VARS",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "MAKE_CELL",
                "operands": "0 (func)",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "6",
                "op": "LOAD_GLOBAL",
                "operands": "1 (NULL + functools)",
                "comment": ""
              },
              {
                "addr": "16",
                "op": "LOAD_ATTR",
                "operands": "2 (wraps)",
                "comment": ""
              },
              {
                "addr": "36",
                "op": "LOAD_DEREF",
                "operands": "0 (func)",
                "comment": ""
              },
              {
                "addr": "38",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "46",
                "op": "LOAD_CLOSURE",
                "operands": "2 (delay)",
                "comment": ""
              },
              {
                "addr": "48",
                "op": "LOAD_CLOSURE",
                "operands": "0 (func)",
                "comment": ""
              },
              {
                "addr": "50",
                "op": "LOAD_CLOSURE",
                "operands": "3 (max_attempts)",
                "comment": ""
              },
              {
                "addr": "52",
                "op": "BUILD_TUPLE",
                "operands": "3",
                "comment": ""
              },
              {
                "addr": "54",
                "op": "LOAD_CONST",
                "operands": "1 (<code object wrapper at 0x7506f7343c90, file \"<input>\", line 16>)",
                "comment": ""
              },
              {
                "addr": "56",
                "op": "MAKE_FUNCTION",
                "operands": "8 (closure)",
                "comment": ""
              },
              {
                "addr": "58",
                "op": "CALL",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "66",
                "op": "STORE_FAST",
                "operands": "1 (wrapper)",
                "comment": ""
              },
              {
                "addr": "68",
                "op": "LOAD_FAST",
                "operands": "1 (wrapper)",
                "comment": ""
              },
              {
                "addr": "70",
                "op": "RETURN_VALUE",
                "operands": "",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object wrapper at 0x7506f7343c90, file \"<input>\", line 16>",
            "instructions": [
              {
                "addr": "0",
                "op": "COPY_FREE_VARS",
                "operands": "3",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "LOAD_CONST",
                "operands": "0 (None)",
                "comment": ""
              },
              {
                "addr": "6",
                "op": "STORE_FAST",
                "operands": "2 (last_error)",
                "comment": ""
              },
              {
                "addr": "8",
                "op": "LOAD_GLOBAL",
                "operands": "1 (NULL + range)",
                "comment": ""
              },
              {
                "addr": "18",
                "op": "LOAD_DEREF",
                "operands": "7 (max_attempts)",
                "comment": ""
              },
              {
                "addr": "20",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "28",
                "op": "GET_ITER",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "34",
                "op": "STORE_FAST",
                "operands": "3 (attempt)",
                "comment": ""
              },
              {
                "addr": "36",
                "op": "NOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "38",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "40",
                "op": "LOAD_DEREF",
                "operands": "6 (func)",
                "comment": ""
              },
              {
                "addr": "42",
                "op": "LOAD_FAST",
                "operands": "0 (args)",
                "comment": ""
              },
              {
                "addr": "44",
                "op": "BUILD_MAP",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "46",
                "op": "LOAD_FAST",
                "operands": "1 (kwargs)",
                "comment": ""
              },
              {
                "addr": "48",
                "op": "DICT_MERGE",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "50",
                "op": "CALL_FUNCTION_EX",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "52",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "54",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "56",
                "op": "RETURN_VALUE",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "60",
                "op": "LOAD_FAST",
                "operands": "2 (last_error)",
                "comment": ""
              },
              {
                "addr": "62",
                "op": "RAISE_VARARGS",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "66",
                "op": "LOAD_GLOBAL",
                "operands": "2 (Exception)",
                "comment": ""
              },
              {
                "addr": "76",
                "op": "CHECK_EXC_MATCH",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "78",
                "op": "POP_JUMP_IF_FALSE",
                "operands": "41 (to 162)",
                "comment": ""
              },
              {
                "addr": "80",
                "op": "STORE_FAST",
                "operands": "4 (e)",
                "comment": ""
              },
              {
                "addr": "82",
                "op": "LOAD_FAST",
                "operands": "4 (e)",
                "comment": ""
              },
              {
                "addr": "84",
                "op": "STORE_FAST",
                "operands": "2 (last_error)",
                "comment": ""
              },
              {
                "addr": "86",
                "op": "LOAD_FAST",
                "operands": "3 (attempt)",
                "comment": ""
              },
              {
                "addr": "88",
                "op": "LOAD_DEREF",
                "operands": "7 (max_attempts)",
                "comment": ""
              },
              {
                "addr": "90",
                "op": "LOAD_CONST",
                "operands": "1 (1)",
                "comment": ""
              },
              {
                "addr": "92",
                "op": "BINARY_OP",
                "operands": "10 (-)",
                "comment": ""
              },
              {
                "addr": "96",
                "op": "COMPARE_OP",
                "operands": "2 (<)",
                "comment": ""
              },
              {
                "addr": "100",
                "op": "POP_JUMP_IF_FALSE",
                "operands": "21 (to 144)",
                "comment": ""
              },
              {
                "addr": "102",
                "op": "LOAD_GLOBAL",
                "operands": "5 (NULL + time)",
                "comment": ""
              },
              {
                "addr": "112",
                "op": "LOAD_ATTR",
                "operands": "6 (sleep)",
                "comment": ""
              },
              {
                "addr": "132",
                "op": "LOAD_DEREF",
                "operands": "5 (delay)",
                "comment": ""
              },
              {
                "addr": "134",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "142",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "146",
                "op": "LOAD_CONST",
                "operands": "0 (None)",
                "comment": ""
              },
              {
                "addr": "148",
                "op": "STORE_FAST",
                "operands": "4 (e)",
                "comment": ""
              },
              {
                "addr": "150",
                "op": "DELETE_FAST",
                "operands": "4 (e)",
                "comment": ""
              },
              {
                "addr": "152",
                "op": "JUMP_BACKWARD",
                "operands": "62 (to 30)",
                "comment": ""
              },
              {
                "addr": "156",
                "op": "STORE_FAST",
                "operands": "4 (e)",
                "comment": ""
              },
              {
                "addr": "158",
                "op": "DELETE_FAST",
                "operands": "4 (e)",
                "comment": ""
              },
              {
                "addr": "160",
                "op": "RERAISE",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "166",
                "op": "POP_EXCEPT",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "168",
                "op": "RERAISE",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "38",
                "op": "to",
                "operands": "50 -> 64 [1]",
                "comment": ""
              },
              {
                "addr": "64",
                "op": "to",
                "operands": "80 -> 164 [2] lasti",
                "comment": ""
              },
              {
                "addr": "82",
                "op": "to",
                "operands": "142 -> 154 [2] lasti",
                "comment": ""
              },
              {
                "addr": "154",
                "op": "to",
                "operands": "162 -> 164 [2] lasti",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object cache_result at 0x7506f7221ce0, file \"<input>\", line 30>",
            "instructions": [
              {
                "addr": "0",
                "op": "MAKE_CELL",
                "operands": "0 (func)",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "MAKE_CELL",
                "operands": "2 (cache)",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "6",
                "op": "BUILD_MAP",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "8",
                "op": "STORE_DEREF",
                "operands": "2 (cache)",
                "comment": ""
              },
              {
                "addr": "10",
                "op": "LOAD_GLOBAL",
                "operands": "1 (NULL + functools)",
                "comment": ""
              },
              {
                "addr": "20",
                "op": "LOAD_ATTR",
                "operands": "2 (wraps)",
                "comment": ""
              },
              {
                "addr": "40",
                "op": "LOAD_DEREF",
                "operands": "0 (func)",
                "comment": ""
              },
              {
                "addr": "42",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "50",
                "op": "LOAD_CLOSURE",
                "operands": "2 (cache)",
                "comment": ""
              },
              {
                "addr": "52",
                "op": "LOAD_CLOSURE",
                "operands": "0 (func)",
                "comment": ""
              },
              {
                "addr": "54",
                "op": "BUILD_TUPLE",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "56",
                "op": "LOAD_CONST",
                "operands": "1 (<code object wrapper at 0x7506f720e010, file \"<input>\", line 32>)",
                "comment": ""
              },
              {
                "addr": "58",
                "op": "MAKE_FUNCTION",
                "operands": "8 (closure)",
                "comment": ""
              },
              {
                "addr": "60",
                "op": "CALL",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "68",
                "op": "STORE_FAST",
                "operands": "1 (wrapper)",
                "comment": ""
              },
              {
                "addr": "70",
                "op": "LOAD_FAST",
                "operands": "1 (wrapper)",
                "comment": ""
              },
              {
                "addr": "72",
                "op": "RETURN_VALUE",
                "operands": "",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object wrapper at 0x7506f720e010, file \"<input>\", line 32>",
            "instructions": [
              {
                "addr": "0",
                "op": "COPY_FREE_VARS",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "LOAD_FAST",
                "operands": "0 (args)",
                "comment": ""
              },
              {
                "addr": "6",
                "op": "LOAD_DEREF",
                "operands": "1 (cache)",
                "comment": ""
              },
              {
                "addr": "8",
                "op": "CONTAINS_OP",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "10",
                "op": "POP_JUMP_IF_FALSE",
                "operands": "8 (to 28)",
                "comment": ""
              },
              {
                "addr": "12",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "14",
                "op": "LOAD_DEREF",
                "operands": "2 (func)",
                "comment": ""
              },
              {
                "addr": "16",
                "op": "LOAD_FAST",
                "operands": "0 (args)",
                "comment": ""
              },
              {
                "addr": "18",
                "op": "CALL_FUNCTION_EX",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "20",
                "op": "LOAD_DEREF",
                "operands": "1 (cache)",
                "comment": ""
              },
              {
                "addr": "22",
                "op": "LOAD_FAST",
                "operands": "0 (args)",
                "comment": ""
              },
              {
                "addr": "24",
                "op": "STORE_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "30",
                "op": "LOAD_FAST",
                "operands": "0 (args)",
                "comment": ""
              },
              {
                "addr": "32",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "36",
                "op": "RETURN_VALUE",
                "operands": "",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object expensive_compute at 0x7506f722d030, file \"<input>\", line 39>",
            "instructions": [
              {
                "addr": "0",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "LOAD_CONST",
                "operands": "1 (0)",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "STORE_FAST",
                "operands": "1 (total)",
                "comment": ""
              },
              {
                "addr": "6",
                "op": "LOAD_GLOBAL",
                "operands": "1 (NULL + range)",
                "comment": ""
              },
              {
                "addr": "16",
                "op": "LOAD_FAST",
                "operands": "0 (n)",
                "comment": ""
              },
              {
                "addr": "18",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "26",
                "op": "GET_ITER",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "32",
                "op": "STORE_FAST",
                "operands": "2 (i)",
                "comment": ""
              },
              {
                "addr": "34",
                "op": "LOAD_FAST",
                "operands": "1 (total)",
                "comment": ""
              },
              {
                "addr": "36",
                "op": "LOAD_FAST",
                "operands": "2 (i)",
                "comment": ""
              },
              {
                "addr": "38",
                "op": "LOAD_CONST",
                "operands": "2 (2)",
                "comment": ""
              },
              {
                "addr": "40",
                "op": "BINARY_OP",
                "operands": "8 (**)",
                "comment": ""
              },
              {
                "addr": "44",
                "op": "BINARY_OP",
                "operands": "13 (+=)",
                "comment": ""
              },
              {
                "addr": "48",
                "op": "STORE_FAST",
                "operands": "1 (total)",
                "comment": ""
              },
              {
                "addr": "50",
                "op": "JUMP_BACKWARD",
                "operands": "12 (to 28)",
                "comment": ""
              },
              {
                "addr": "54",
                "op": "LOAD_FAST",
                "operands": "1 (total)",
                "comment": ""
              },
              {
                "addr": "56",
                "op": "RETURN_VALUE",
                "operands": "",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object flaky_operation at 0x7506f7221df0, file \"<input>\", line 47>",
            "instructions": [
              {
                "addr": "0",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "LOAD_CONST",
                "operands": "1 (0)",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "LOAD_CONST",
                "operands": "0 (None)",
                "comment": ""
              },
              {
                "addr": "6",
                "op": "IMPORT_NAME",
                "operands": "0 (random)",
                "comment": ""
              },
              {
                "addr": "8",
                "op": "STORE_FAST",
                "operands": "0 (random)",
                "comment": ""
              },
              {
                "addr": "10",
                "op": "LOAD_FAST",
                "operands": "0 (random)",
                "comment": ""
              },
              {
                "addr": "12",
                "op": "LOAD_ATTR",
                "operands": "1 (NULL|self + random)",
                "comment": ""
              },
              {
                "addr": "32",
                "op": "CALL",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "40",
                "op": "LOAD_CONST",
                "operands": "2 (0.7)",
                "comment": ""
              },
              {
                "addr": "42",
                "op": "COMPARE_OP",
                "operands": "2 (<)",
                "comment": ""
              },
              {
                "addr": "46",
                "op": "POP_JUMP_IF_FALSE",
                "operands": "11 (to 70)",
                "comment": ""
              },
              {
                "addr": "48",
                "op": "LOAD_GLOBAL",
                "operands": "3 (NULL + ConnectionError)",
                "comment": ""
              },
              {
                "addr": "58",
                "op": "LOAD_CONST",
                "operands": "3 ('Network timeout')",
                "comment": ""
              },
              {
                "addr": "60",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "68",
                "op": "RAISE_VARARGS",
                "operands": "1",
                "comment": ""
              }
            ]
          }
        ],
        "notes": "Python bytecode via dis module."
      },
      "debugger": {
        "steps": [
          {
            "line": 1,
            "description": "import time",
            "registers": {},
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 2,
            "description": "import functools",
            "registers": {},
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 39,
            "description": "@timer",
            "registers": {},
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 40,
            "description": "@cache_result",
            "registers": {},
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 47,
            "description": "Call retry",
            "registers": {},
            "stack": [
              "<module>",
              "retry()"
            ]
          },
          {
            "line": 15,
            "description": "  def decorator(func):",
            "registers": {},
            "stack": [
              "<module>",
              "retry()"
            ]
          },
          {
            "line": 16,
            "description": "  @functools.wraps(func)",
            "registers": {},
            "stack": [
              "<module>",
              "retry()"
            ]
          },
          {
            "line": 17,
            "description": "  def wrapper(*args, **kwargs):",
            "registers": {},
            "stack": [
              "<module>",
              "retry()"
            ]
          },
          {
            "line": 18,
            "description": "  last_error = None",
            "registers": {},
            "stack": [
              "<module>",
              "retry()"
            ]
          },
          {
            "line": 19,
            "description": "  for attempt in range(max_attempts):",
            "registers": {},
            "stack": [
              "<module>",
              "retry()"
            ]
          },
          {
            "line": 20,
            "description": "  try:",
            "registers": {},
            "stack": [
              "<module>",
              "retry()"
            ]
          },
          {
            "line": 21,
            "description": "  return func(*args, **kwargs)",
            "registers": {},
            "stack": [
              "<module>",
              "retry()"
            ]
          },
          {
            "line": 22,
            "description": "  except Exception as e:",
            "registers": {},
            "stack": [
              "<module>",
              "retry()"
            ]
          },
          {
            "line": 23,
            "description": "  last_error = e",
            "registers": {},
            "stack": [
              "<module>",
              "retry()"
            ]
          },
          {
            "line": 24,
            "description": "  if attempt < max_attempts - 1:",
            "registers": {},
            "stack": [
              "<module>",
              "retry()"
            ]
          },
          {
            "line": 25,
            "description": "  time.sleep(delay)",
            "registers": {},
            "stack": [
              "<module>",
              "retry()"
            ]
          },
          {
            "line": 26,
            "description": "  raise last_error",
            "registers": {},
            "stack": [
              "<module>",
              "retry()"
            ]
          },
          {
            "line": 27,
            "description": "  return wrapper",
            "registers": {},
            "stack": [
              "<module>",
              "retry()"
            ]
          },
          {
            "line": 28,
            "description": "  return decorator",
            "registers": {},
            "stack": [
              "<module>",
              "retry()"
            ]
          },
          {
            "line": 28,
            "description": "Return from retry",
            "registers": {},
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 54,
            "description": "Assign result = expensive_compute(10000)",
            "registers": {
              "result": "expensive_compute(10000)"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 55,
            "description": "print(f\"Result: {result}\")",
            "registers": {
              "result": "expensive_compute(10000)"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 56,
            "description": "Assign result2 = expensive_compute(10000)",
            "registers": {
              "result2": "expensive_compute(10000)",
              "result": "expensive_compute(10000)"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 57,
            "description": "print(f\"Cached: {result2}\")",
            "registers": {
              "result2": "expensive_compute(10000)",
              "result": "expensive_compute(10000)"
            },
            "stack": [
              "<module>"
            ]
          }
        ]
      },
      "compare": {
        "comparisons": []
      }
    }
  },
  {
    "id": "py-matrix-ops",
    "title": "Matrix Operations",
    "description": "Nested loops, memory layout, and cache performance",
    "language": "python",
    "code": "def matrix_create(rows, cols, fill=0):\n    return [[fill] * cols for _ in range(rows)]\n\ndef matrix_multiply(a, b):\n    rows_a, cols_a = len(a), len(a[0])\n    rows_b, cols_b = len(b), len(b[0])\n    assert cols_a == rows_b, \"Incompatible dimensions\"\n    result = matrix_create(rows_a, cols_b)\n    for i in range(rows_a):\n        for j in range(cols_b):\n            total = 0\n            for k in range(cols_a):\n                total += a[i][k] * b[k][j]\n            result[i][j] = total\n    return result\n\ndef matrix_transpose(m):\n    rows, cols = len(m), len(m[0])\n    return [[m[j][i] for j in range(rows)] for i in range(cols)]\n\ndef matrix_add(a, b):\n    return [[a[i][j] + b[i][j] for j in range(len(a[0]))] for i in range(len(a))]\n\nn = 8\na = [[i * n + j for j in range(n)] for i in range(n)]\nb = [[1 if i == j else 0 for j in range(n)] for i in range(n)]\n\nproduct = matrix_multiply(a, b)\ntransposed = matrix_transpose(a)\nsummed = matrix_add(a, transposed)\nprint(f\"A[0] = {a[0]}\")\nprint(f\"(A*I)[0] = {product[0]}\")\nprint(f\"(A+A^T)[0] = {summed[0]}\")",
    "analysis": {
      "language": "python",
      "execution": {
        "instructions": [
          {
            "op": "CALL",
            "detail": "call matrix_create(rows, cols, fill)",
            "cycles": 100
          },
          {
            "op": "LOAD",
            "detail": "load param rows",
            "cycles": 1
          },
          {
            "op": "LOAD",
            "detail": "load param cols",
            "cycles": 1
          },
          {
            "op": "LOAD",
            "detail": "load param fill",
            "cycles": 1
          },
          {
            "op": "STORE",
            "detail": "store return of matrix_create",
            "cycles": 1
          },
          {
            "op": "CALL",
            "detail": "call matrix_multiply(a, b)",
            "cycles": 100
          },
          {
            "op": "LOAD",
            "detail": "load param a",
            "cycles": 1
          },
          {
            "op": "LOAD",
            "detail": "load param b",
            "cycles": 1
          },
          {
            "op": "STORE",
            "detail": "store return of matrix_multiply",
            "cycles": 1
          },
          {
            "op": "CALL",
            "detail": "call matrix_transpose(m)",
            "cycles": 100
          },
          {
            "op": "LOAD",
            "detail": "load param m",
            "cycles": 1
          },
          {
            "op": "STORE",
            "detail": "store return of matrix_transpose",
            "cycles": 1
          },
          {
            "op": "CALL",
            "detail": "call matrix_add(a, b)",
            "cycles": 100
          },
          {
            "op": "LOAD",
            "detail": "load param a",
            "cycles": 1
          },
          {
            "op": "LOAD",
            "detail": "load param b",
            "cycles": 1
          },
          {
            "op": "STORE",
            "detail": "store return of matrix_add",
            "cycles": 1
          },
          {
            "op": "LOOP_START",
            "detail": "for loop ~100 iterations (lines 9-14)",
            "cycles": 8
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "CMP",
            "detail": "loop condition x100",
            "cycles": 500
          },
          {
            "op": "LOOP_END",
            "detail": "end for loop",
            "cycles": 0
          },
          {
            "op": "LOOP_START",
            "detail": "for loop ~100 iterations (lines 10-14)",
            "cycles": 8
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "CMP",
            "detail": "loop condition x100",
            "cycles": 500
          },
          {
            "op": "LOOP_END",
            "detail": "end for loop",
            "cycles": 0
          },
          {
            "op": "LOOP_START",
            "detail": "for loop ~100 iterations (lines 12-13)",
            "cycles": 8
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "CMP",
            "detail": "loop condition x100",
            "cycles": 500
          },
          {
            "op": "LOOP_END",
            "detail": "end for loop",
            "cycles": 0
          },
          {
            "op": "ALLOC",
            "detail": "allocate list (Heap) — list with 1 elements",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~23 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~14 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~24 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~25 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate list_comprehension (Heap) — list comprehension (size depends on input)",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate list_comprehension (Heap) — list comprehension (size depends on input)",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate list_comprehension (Heap) — list comprehension (size depends on input)",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate list_comprehension (Heap) — list comprehension (size depends on input)",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate list_comprehension (Heap) — list comprehension (size depends on input)",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate list_comprehension (Heap) — list comprehension (size depends on input)",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate list_comprehension (Heap) — list comprehension (size depends on input)",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate list_comprehension (Heap) — list comprehension (size depends on input)",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate list_comprehension (Heap) — list comprehension (size depends on input)",
            "cycles": 20
          }
        ],
        "maxCycles": 5716,
        "summary": "44 pseudo-instructions, 5716 estimated cycles (4 functions, 3 loops, 14 allocations)"
      },
      "cost": {
        "lines": [
          {
            "line": 1,
            "cost": 50,
            "label": "~50 cycles"
          },
          {
            "line": 2,
            "cost": 40,
            "label": "~40 cycles"
          },
          {
            "line": 4,
            "cost": 50,
            "label": "~50 cycles"
          },
          {
            "line": 7,
            "cost": 20,
            "label": "~20 cycles"
          },
          {
            "line": 9,
            "cost": 8,
            "label": "~8 cycles"
          },
          {
            "line": 10,
            "cost": 508,
            "label": "~508 cycles"
          },
          {
            "line": 11,
            "cost": 1000,
            "label": "~1000 cycles"
          },
          {
            "line": 12,
            "cost": 1008,
            "label": "~1008 cycles"
          },
          {
            "line": 13,
            "cost": 1500,
            "label": "~1500 cycles"
          },
          {
            "line": 14,
            "cost": 1000,
            "label": "~1000 cycles"
          },
          {
            "line": 17,
            "cost": 50,
            "label": "~50 cycles"
          },
          {
            "line": 19,
            "cost": 40,
            "label": "~40 cycles"
          },
          {
            "line": 21,
            "cost": 50,
            "label": "~50 cycles"
          },
          {
            "line": 22,
            "cost": 40,
            "label": "~40 cycles"
          },
          {
            "line": 25,
            "cost": 40,
            "label": "~40 cycles"
          },
          {
            "line": 26,
            "cost": 40,
            "label": "~40 cycles"
          },
          {
            "line": 31,
            "cost": 20,
            "label": "~20 cycles"
          },
          {
            "line": 32,
            "cost": 20,
            "label": "~20 cycles"
          },
          {
            "line": 33,
            "cost": 20,
            "label": "~20 cycles"
          }
        ],
        "maxCost": 1500,
        "insights": "Line 13 is the hottest at ~1500 estimated cycles. 4 function(s), 3 loop(s), 14 allocation(s) contribute to the total cost."
      },
      "memory": {
        "allocations": [
          {
            "type": "heap",
            "name": "list",
            "detail": "list with 1 elements",
            "size": "~64 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~23 chars",
            "size": "~72 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~14 chars",
            "size": "~63 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~24 chars",
            "size": "~73 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~25 chars",
            "size": "~74 B"
          },
          {
            "type": "heap",
            "name": "list_comprehension",
            "detail": "list comprehension (size depends on input)",
            "size": "~dynamic B"
          },
          {
            "type": "heap",
            "name": "list_comprehension",
            "detail": "list comprehension (size depends on input)",
            "size": "~dynamic B"
          },
          {
            "type": "heap",
            "name": "list_comprehension",
            "detail": "list comprehension (size depends on input)",
            "size": "~dynamic B"
          },
          {
            "type": "heap",
            "name": "list_comprehension",
            "detail": "list comprehension (size depends on input)",
            "size": "~dynamic B"
          },
          {
            "type": "heap",
            "name": "list_comprehension",
            "detail": "list comprehension (size depends on input)",
            "size": "~dynamic B"
          },
          {
            "type": "heap",
            "name": "list_comprehension",
            "detail": "list comprehension (size depends on input)",
            "size": "~dynamic B"
          },
          {
            "type": "heap",
            "name": "list_comprehension",
            "detail": "list comprehension (size depends on input)",
            "size": "~dynamic B"
          },
          {
            "type": "heap",
            "name": "list_comprehension",
            "detail": "list comprehension (size depends on input)",
            "size": "~dynamic B"
          },
          {
            "type": "heap",
            "name": "list_comprehension",
            "detail": "list comprehension (size depends on input)",
            "size": "~dynamic B"
          }
        ],
        "stackTotal": "0 B",
        "heapTotal": "346 B",
        "allocCount": 14,
        "notes": "14 heap allocations totaling ~346 B Largest: string of ~25 chars (~74 B)."
      },
      "concurrency": {
        "threads": [
          {
            "name": "main",
            "events": []
          }
        ],
        "warnings": [],
        "analysis": "No concurrency issues detected."
      },
      "assembly": {
        "arch": "cpython-bytecode",
        "blocks": [
          {
            "label": "module",
            "instructions": [
              {
                "addr": "0",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "LOAD_CONST",
                "operands": "11 ((0,))",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "LOAD_CONST",
                "operands": "1 (<code object matrix_create at 0x7db1b621dac0, file \"<input>\", line 1>)",
                "comment": ""
              },
              {
                "addr": "6",
                "op": "MAKE_FUNCTION",
                "operands": "1 (defaults)",
                "comment": ""
              },
              {
                "addr": "8",
                "op": "STORE_NAME",
                "operands": "0 (matrix_create)",
                "comment": ""
              },
              {
                "addr": "10",
                "op": "LOAD_CONST",
                "operands": "2 (<code object matrix_multiply at 0x7db1b63b1230, file \"<input>\", line 4>)",
                "comment": ""
              },
              {
                "addr": "12",
                "op": "MAKE_FUNCTION",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "14",
                "op": "STORE_NAME",
                "operands": "1 (matrix_multiply)",
                "comment": ""
              },
              {
                "addr": "16",
                "op": "LOAD_CONST",
                "operands": "3 (<code object matrix_transpose at 0x7db1b6d82d30, file \"<input>\", line 17>)",
                "comment": ""
              },
              {
                "addr": "18",
                "op": "MAKE_FUNCTION",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "20",
                "op": "STORE_NAME",
                "operands": "2 (matrix_transpose)",
                "comment": ""
              },
              {
                "addr": "22",
                "op": "LOAD_CONST",
                "operands": "4 (<code object matrix_add at 0x7db1b63eb6e0, file \"<input>\", line 21>)",
                "comment": ""
              },
              {
                "addr": "24",
                "op": "MAKE_FUNCTION",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "26",
                "op": "STORE_NAME",
                "operands": "3 (matrix_add)",
                "comment": ""
              },
              {
                "addr": "28",
                "op": "LOAD_CONST",
                "operands": "5 (8)",
                "comment": ""
              },
              {
                "addr": "30",
                "op": "STORE_NAME",
                "operands": "4 (n)",
                "comment": ""
              },
              {
                "addr": "32",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "34",
                "op": "LOAD_NAME",
                "operands": "5 (range)",
                "comment": ""
              },
              {
                "addr": "36",
                "op": "LOAD_NAME",
                "operands": "4 (n)",
                "comment": ""
              },
              {
                "addr": "38",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "46",
                "op": "GET_ITER",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "48",
                "op": "LOAD_FAST_AND_CLEAR",
                "operands": "0 (i)",
                "comment": ""
              },
              {
                "addr": "50",
                "op": "LOAD_FAST_AND_CLEAR",
                "operands": "1 (j)",
                "comment": ""
              },
              {
                "addr": "52",
                "op": "SWAP",
                "operands": "3",
                "comment": ""
              },
              {
                "addr": "54",
                "op": "BUILD_LIST",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "56",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "62",
                "op": "STORE_FAST",
                "operands": "0 (i)",
                "comment": ""
              },
              {
                "addr": "64",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "66",
                "op": "LOAD_NAME",
                "operands": "5 (range)",
                "comment": ""
              },
              {
                "addr": "68",
                "op": "LOAD_NAME",
                "operands": "4 (n)",
                "comment": ""
              },
              {
                "addr": "70",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "78",
                "op": "GET_ITER",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "80",
                "op": "LOAD_FAST_AND_CLEAR",
                "operands": "1 (j)",
                "comment": ""
              },
              {
                "addr": "82",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "84",
                "op": "BUILD_LIST",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "86",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "92",
                "op": "STORE_FAST",
                "operands": "1 (j)",
                "comment": ""
              },
              {
                "addr": "94",
                "op": "LOAD_FAST",
                "operands": "0 (i)",
                "comment": ""
              },
              {
                "addr": "96",
                "op": "LOAD_NAME",
                "operands": "4 (n)",
                "comment": ""
              },
              {
                "addr": "98",
                "op": "BINARY_OP",
                "operands": "5 (*)",
                "comment": ""
              },
              {
                "addr": "102",
                "op": "LOAD_FAST",
                "operands": "1 (j)",
                "comment": ""
              },
              {
                "addr": "104",
                "op": "BINARY_OP",
                "operands": "0 (+)",
                "comment": ""
              },
              {
                "addr": "108",
                "op": "LIST_APPEND",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "110",
                "op": "JUMP_BACKWARD",
                "operands": "12 (to 88)",
                "comment": ""
              },
              {
                "addr": "114",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "116",
                "op": "STORE_FAST",
                "operands": "1 (j)",
                "comment": ""
              },
              {
                "addr": "118",
                "op": "LIST_APPEND",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "120",
                "op": "JUMP_BACKWARD",
                "operands": "32 (to 58)",
                "comment": ""
              },
              {
                "addr": "124",
                "op": "SWAP",
                "operands": "3",
                "comment": ""
              },
              {
                "addr": "126",
                "op": "STORE_FAST",
                "operands": "1 (j)",
                "comment": ""
              },
              {
                "addr": "128",
                "op": "STORE_FAST",
                "operands": "0 (i)",
                "comment": ""
              },
              {
                "addr": "130",
                "op": "STORE_NAME",
                "operands": "6 (a)",
                "comment": ""
              },
              {
                "addr": "132",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "134",
                "op": "LOAD_NAME",
                "operands": "5 (range)",
                "comment": ""
              },
              {
                "addr": "136",
                "op": "LOAD_NAME",
                "operands": "4 (n)",
                "comment": ""
              },
              {
                "addr": "138",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "146",
                "op": "GET_ITER",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "148",
                "op": "LOAD_FAST_AND_CLEAR",
                "operands": "0 (i)",
                "comment": ""
              },
              {
                "addr": "150",
                "op": "LOAD_FAST_AND_CLEAR",
                "operands": "1 (j)",
                "comment": ""
              },
              {
                "addr": "152",
                "op": "SWAP",
                "operands": "3",
                "comment": ""
              },
              {
                "addr": "154",
                "op": "BUILD_LIST",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "156",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "162",
                "op": "STORE_FAST",
                "operands": "0 (i)",
                "comment": ""
              },
              {
                "addr": "164",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "166",
                "op": "LOAD_NAME",
                "operands": "5 (range)",
                "comment": ""
              },
              {
                "addr": "168",
                "op": "LOAD_NAME",
                "operands": "4 (n)",
                "comment": ""
              },
              {
                "addr": "170",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "178",
                "op": "GET_ITER",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "180",
                "op": "LOAD_FAST_AND_CLEAR",
                "operands": "1 (j)",
                "comment": ""
              },
              {
                "addr": "182",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "184",
                "op": "BUILD_LIST",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "186",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "192",
                "op": "STORE_FAST",
                "operands": "1 (j)",
                "comment": ""
              },
              {
                "addr": "194",
                "op": "LOAD_FAST",
                "operands": "0 (i)",
                "comment": ""
              },
              {
                "addr": "196",
                "op": "LOAD_FAST",
                "operands": "1 (j)",
                "comment": ""
              },
              {
                "addr": "198",
                "op": "COMPARE_OP",
                "operands": "40 (==)",
                "comment": ""
              },
              {
                "addr": "202",
                "op": "POP_JUMP_IF_FALSE",
                "operands": "2 (to 208)",
                "comment": ""
              },
              {
                "addr": "204",
                "op": "LOAD_CONST",
                "operands": "6 (1)",
                "comment": ""
              },
              {
                "addr": "206",
                "op": "JUMP_FORWARD",
                "operands": "1 (to 210)",
                "comment": ""
              },
              {
                "addr": "212",
                "op": "JUMP_BACKWARD",
                "operands": "13 (to 188)",
                "comment": ""
              },
              {
                "addr": "216",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "218",
                "op": "STORE_FAST",
                "operands": "1 (j)",
                "comment": ""
              },
              {
                "addr": "220",
                "op": "LIST_APPEND",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "222",
                "op": "JUMP_BACKWARD",
                "operands": "33 (to 158)",
                "comment": ""
              },
              {
                "addr": "226",
                "op": "SWAP",
                "operands": "3",
                "comment": ""
              },
              {
                "addr": "228",
                "op": "STORE_FAST",
                "operands": "1 (j)",
                "comment": ""
              },
              {
                "addr": "230",
                "op": "STORE_FAST",
                "operands": "0 (i)",
                "comment": ""
              },
              {
                "addr": "232",
                "op": "STORE_NAME",
                "operands": "7 (b)",
                "comment": ""
              },
              {
                "addr": "234",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "236",
                "op": "LOAD_NAME",
                "operands": "1 (matrix_multiply)",
                "comment": ""
              },
              {
                "addr": "238",
                "op": "LOAD_NAME",
                "operands": "6 (a)",
                "comment": ""
              },
              {
                "addr": "240",
                "op": "LOAD_NAME",
                "operands": "7 (b)",
                "comment": ""
              },
              {
                "addr": "242",
                "op": "CALL",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "250",
                "op": "STORE_NAME",
                "operands": "8 (product)",
                "comment": ""
              },
              {
                "addr": "252",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "254",
                "op": "LOAD_NAME",
                "operands": "2 (matrix_transpose)",
                "comment": ""
              },
              {
                "addr": "256",
                "op": "LOAD_NAME",
                "operands": "6 (a)",
                "comment": ""
              },
              {
                "addr": "258",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "266",
                "op": "STORE_NAME",
                "operands": "9 (transposed)",
                "comment": ""
              },
              {
                "addr": "268",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "270",
                "op": "LOAD_NAME",
                "operands": "3 (matrix_add)",
                "comment": ""
              },
              {
                "addr": "272",
                "op": "LOAD_NAME",
                "operands": "6 (a)",
                "comment": ""
              },
              {
                "addr": "274",
                "op": "LOAD_NAME",
                "operands": "9 (transposed)",
                "comment": ""
              },
              {
                "addr": "276",
                "op": "CALL",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "284",
                "op": "STORE_NAME",
                "operands": "10 (summed)",
                "comment": ""
              },
              {
                "addr": "286",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "288",
                "op": "LOAD_NAME",
                "operands": "11 (print)",
                "comment": ""
              },
              {
                "addr": "290",
                "op": "LOAD_CONST",
                "operands": "7 ('A[0] = ')",
                "comment": ""
              },
              {
                "addr": "292",
                "op": "LOAD_NAME",
                "operands": "6 (a)",
                "comment": ""
              },
              {
                "addr": "294",
                "op": "LOAD_CONST",
                "operands": "0 (0)",
                "comment": ""
              },
              {
                "addr": "296",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "300",
                "op": "FORMAT_VALUE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "302",
                "op": "BUILD_STRING",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "304",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "312",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "314",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "316",
                "op": "LOAD_NAME",
                "operands": "11 (print)",
                "comment": ""
              },
              {
                "addr": "318",
                "op": "LOAD_CONST",
                "operands": "8 ('(A*I)[0] = ')",
                "comment": ""
              },
              {
                "addr": "320",
                "op": "LOAD_NAME",
                "operands": "8 (product)",
                "comment": ""
              },
              {
                "addr": "322",
                "op": "LOAD_CONST",
                "operands": "0 (0)",
                "comment": ""
              },
              {
                "addr": "324",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "328",
                "op": "FORMAT_VALUE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "330",
                "op": "BUILD_STRING",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "332",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "340",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "342",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "344",
                "op": "LOAD_NAME",
                "operands": "11 (print)",
                "comment": ""
              },
              {
                "addr": "346",
                "op": "LOAD_CONST",
                "operands": "9 ('(A+A^T)[0] = ')",
                "comment": ""
              },
              {
                "addr": "348",
                "op": "LOAD_NAME",
                "operands": "10 (summed)",
                "comment": ""
              },
              {
                "addr": "350",
                "op": "LOAD_CONST",
                "operands": "0 (0)",
                "comment": ""
              },
              {
                "addr": "352",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "356",
                "op": "FORMAT_VALUE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "358",
                "op": "BUILD_STRING",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "360",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "368",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "370",
                "op": "RETURN_CONST",
                "operands": "10 (None)",
                "comment": ""
              },
              {
                "addr": "374",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "376",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "378",
                "op": "STORE_FAST",
                "operands": "1 (j)",
                "comment": ""
              },
              {
                "addr": "380",
                "op": "RERAISE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "384",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "386",
                "op": "SWAP",
                "operands": "3",
                "comment": ""
              },
              {
                "addr": "388",
                "op": "STORE_FAST",
                "operands": "1 (j)",
                "comment": ""
              },
              {
                "addr": "390",
                "op": "STORE_FAST",
                "operands": "0 (i)",
                "comment": ""
              },
              {
                "addr": "392",
                "op": "RERAISE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "396",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "398",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "400",
                "op": "STORE_FAST",
                "operands": "1 (j)",
                "comment": ""
              },
              {
                "addr": "402",
                "op": "RERAISE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "406",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "408",
                "op": "SWAP",
                "operands": "3",
                "comment": ""
              },
              {
                "addr": "410",
                "op": "STORE_FAST",
                "operands": "1 (j)",
                "comment": ""
              },
              {
                "addr": "412",
                "op": "STORE_FAST",
                "operands": "0 (i)",
                "comment": ""
              },
              {
                "addr": "414",
                "op": "RERAISE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "54",
                "op": "to",
                "operands": "82 -> 382 [3]",
                "comment": ""
              },
              {
                "addr": "84",
                "op": "to",
                "operands": "112 -> 372 [6]",
                "comment": ""
              },
              {
                "addr": "114",
                "op": "to",
                "operands": "122 -> 382 [3]",
                "comment": ""
              },
              {
                "addr": "154",
                "op": "to",
                "operands": "182 -> 404 [3]",
                "comment": ""
              },
              {
                "addr": "184",
                "op": "to",
                "operands": "214 -> 394 [6]",
                "comment": ""
              },
              {
                "addr": "216",
                "op": "to",
                "operands": "224 -> 404 [3]",
                "comment": ""
              },
              {
                "addr": "372",
                "op": "to",
                "operands": "380 -> 382 [3]",
                "comment": ""
              },
              {
                "addr": "394",
                "op": "to",
                "operands": "402 -> 404 [3]",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object matrix_create at 0x7db1b621dac0, file \"<input>\", line 1>",
            "instructions": [
              {
                "addr": "0",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "LOAD_GLOBAL",
                "operands": "1 (NULL + range)",
                "comment": ""
              },
              {
                "addr": "12",
                "op": "LOAD_FAST",
                "operands": "0 (rows)",
                "comment": ""
              },
              {
                "addr": "14",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "22",
                "op": "GET_ITER",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "24",
                "op": "LOAD_FAST_AND_CLEAR",
                "operands": "3 (_)",
                "comment": ""
              },
              {
                "addr": "26",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "28",
                "op": "BUILD_LIST",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "30",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "36",
                "op": "STORE_FAST",
                "operands": "3 (_)",
                "comment": ""
              },
              {
                "addr": "38",
                "op": "LOAD_FAST",
                "operands": "2 (fill)",
                "comment": ""
              },
              {
                "addr": "40",
                "op": "BUILD_LIST",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "42",
                "op": "LOAD_FAST",
                "operands": "1 (cols)",
                "comment": ""
              },
              {
                "addr": "44",
                "op": "BINARY_OP",
                "operands": "5 (*)",
                "comment": ""
              },
              {
                "addr": "48",
                "op": "LIST_APPEND",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "50",
                "op": "JUMP_BACKWARD",
                "operands": "10 (to 32)",
                "comment": ""
              },
              {
                "addr": "54",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "56",
                "op": "STORE_FAST",
                "operands": "3 (_)",
                "comment": ""
              },
              {
                "addr": "58",
                "op": "RETURN_VALUE",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "62",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "64",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "66",
                "op": "STORE_FAST",
                "operands": "3 (_)",
                "comment": ""
              },
              {
                "addr": "68",
                "op": "RERAISE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "28",
                "op": "to",
                "operands": "52 -> 60 [2]",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object matrix_multiply at 0x7db1b63b1230, file \"<input>\", line 4>",
            "instructions": [
              {
                "addr": "0",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "LOAD_GLOBAL",
                "operands": "1 (NULL + len)",
                "comment": ""
              },
              {
                "addr": "12",
                "op": "LOAD_FAST",
                "operands": "0 (a)",
                "comment": ""
              },
              {
                "addr": "14",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "22",
                "op": "LOAD_GLOBAL",
                "operands": "1 (NULL + len)",
                "comment": ""
              },
              {
                "addr": "32",
                "op": "LOAD_FAST",
                "operands": "0 (a)",
                "comment": ""
              },
              {
                "addr": "34",
                "op": "LOAD_CONST",
                "operands": "1 (0)",
                "comment": ""
              },
              {
                "addr": "36",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "40",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "48",
                "op": "STORE_FAST",
                "operands": "3 (cols_a)",
                "comment": ""
              },
              {
                "addr": "50",
                "op": "STORE_FAST",
                "operands": "2 (rows_a)",
                "comment": ""
              },
              {
                "addr": "52",
                "op": "LOAD_GLOBAL",
                "operands": "1 (NULL + len)",
                "comment": ""
              },
              {
                "addr": "62",
                "op": "LOAD_FAST",
                "operands": "1 (b)",
                "comment": ""
              },
              {
                "addr": "64",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "72",
                "op": "LOAD_GLOBAL",
                "operands": "1 (NULL + len)",
                "comment": ""
              },
              {
                "addr": "82",
                "op": "LOAD_FAST",
                "operands": "1 (b)",
                "comment": ""
              },
              {
                "addr": "84",
                "op": "LOAD_CONST",
                "operands": "1 (0)",
                "comment": ""
              },
              {
                "addr": "86",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "90",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "98",
                "op": "STORE_FAST",
                "operands": "5 (cols_b)",
                "comment": ""
              },
              {
                "addr": "100",
                "op": "STORE_FAST",
                "operands": "4 (rows_b)",
                "comment": ""
              },
              {
                "addr": "102",
                "op": "LOAD_FAST",
                "operands": "3 (cols_a)",
                "comment": ""
              },
              {
                "addr": "104",
                "op": "LOAD_FAST",
                "operands": "4 (rows_b)",
                "comment": ""
              },
              {
                "addr": "106",
                "op": "COMPARE_OP",
                "operands": "40 (==)",
                "comment": ""
              },
              {
                "addr": "110",
                "op": "POP_JUMP_IF_TRUE",
                "operands": "7 (to 126)",
                "comment": ""
              },
              {
                "addr": "112",
                "op": "LOAD_ASSERTION_ERROR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "114",
                "op": "LOAD_CONST",
                "operands": "2 ('Incompatible dimensions')",
                "comment": ""
              },
              {
                "addr": "116",
                "op": "CALL",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "124",
                "op": "RAISE_VARARGS",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "136",
                "op": "LOAD_FAST",
                "operands": "2 (rows_a)",
                "comment": ""
              },
              {
                "addr": "138",
                "op": "LOAD_FAST",
                "operands": "5 (cols_b)",
                "comment": ""
              },
              {
                "addr": "140",
                "op": "CALL",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "148",
                "op": "STORE_FAST",
                "operands": "6 (result)",
                "comment": ""
              },
              {
                "addr": "150",
                "op": "LOAD_GLOBAL",
                "operands": "5 (NULL + range)",
                "comment": ""
              },
              {
                "addr": "160",
                "op": "LOAD_FAST",
                "operands": "2 (rows_a)",
                "comment": ""
              },
              {
                "addr": "162",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "170",
                "op": "GET_ITER",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "176",
                "op": "STORE_FAST",
                "operands": "7 (i)",
                "comment": ""
              },
              {
                "addr": "178",
                "op": "LOAD_GLOBAL",
                "operands": "5 (NULL + range)",
                "comment": ""
              },
              {
                "addr": "188",
                "op": "LOAD_FAST",
                "operands": "5 (cols_b)",
                "comment": ""
              },
              {
                "addr": "190",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "198",
                "op": "GET_ITER",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "204",
                "op": "STORE_FAST",
                "operands": "8 (j)",
                "comment": ""
              },
              {
                "addr": "206",
                "op": "LOAD_CONST",
                "operands": "1 (0)",
                "comment": ""
              },
              {
                "addr": "208",
                "op": "STORE_FAST",
                "operands": "9 (total)",
                "comment": ""
              },
              {
                "addr": "210",
                "op": "LOAD_GLOBAL",
                "operands": "5 (NULL + range)",
                "comment": ""
              },
              {
                "addr": "220",
                "op": "LOAD_FAST",
                "operands": "3 (cols_a)",
                "comment": ""
              },
              {
                "addr": "222",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "230",
                "op": "GET_ITER",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "236",
                "op": "STORE_FAST",
                "operands": "10 (k)",
                "comment": ""
              },
              {
                "addr": "238",
                "op": "LOAD_FAST",
                "operands": "9 (total)",
                "comment": ""
              },
              {
                "addr": "240",
                "op": "LOAD_FAST",
                "operands": "0 (a)",
                "comment": ""
              },
              {
                "addr": "242",
                "op": "LOAD_FAST",
                "operands": "7 (i)",
                "comment": ""
              },
              {
                "addr": "244",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "248",
                "op": "LOAD_FAST",
                "operands": "10 (k)",
                "comment": ""
              },
              {
                "addr": "250",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "254",
                "op": "LOAD_FAST",
                "operands": "1 (b)",
                "comment": ""
              },
              {
                "addr": "256",
                "op": "LOAD_FAST",
                "operands": "10 (k)",
                "comment": ""
              },
              {
                "addr": "258",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "262",
                "op": "LOAD_FAST",
                "operands": "8 (j)",
                "comment": ""
              },
              {
                "addr": "264",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "268",
                "op": "BINARY_OP",
                "operands": "5 (*)",
                "comment": ""
              },
              {
                "addr": "272",
                "op": "BINARY_OP",
                "operands": "13 (+=)",
                "comment": ""
              },
              {
                "addr": "276",
                "op": "STORE_FAST",
                "operands": "9 (total)",
                "comment": ""
              },
              {
                "addr": "278",
                "op": "JUMP_BACKWARD",
                "operands": "24 (to 232)",
                "comment": ""
              },
              {
                "addr": "282",
                "op": "LOAD_FAST",
                "operands": "9 (total)",
                "comment": ""
              },
              {
                "addr": "284",
                "op": "LOAD_FAST",
                "operands": "6 (result)",
                "comment": ""
              },
              {
                "addr": "286",
                "op": "LOAD_FAST",
                "operands": "7 (i)",
                "comment": ""
              },
              {
                "addr": "288",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "292",
                "op": "LOAD_FAST",
                "operands": "8 (j)",
                "comment": ""
              },
              {
                "addr": "294",
                "op": "STORE_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "298",
                "op": "JUMP_BACKWARD",
                "operands": "50 (to 200)",
                "comment": ""
              },
              {
                "addr": "302",
                "op": "JUMP_BACKWARD",
                "operands": "66 (to 172)",
                "comment": ""
              },
              {
                "addr": "306",
                "op": "LOAD_FAST",
                "operands": "6 (result)",
                "comment": ""
              },
              {
                "addr": "308",
                "op": "RETURN_VALUE",
                "operands": "",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object matrix_transpose at 0x7db1b6d82d30, file \"<input>\", line 17>",
            "instructions": [
              {
                "addr": "0",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "LOAD_GLOBAL",
                "operands": "1 (NULL + len)",
                "comment": ""
              },
              {
                "addr": "12",
                "op": "LOAD_FAST",
                "operands": "0 (m)",
                "comment": ""
              },
              {
                "addr": "14",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "22",
                "op": "LOAD_GLOBAL",
                "operands": "1 (NULL + len)",
                "comment": ""
              },
              {
                "addr": "32",
                "op": "LOAD_FAST",
                "operands": "0 (m)",
                "comment": ""
              },
              {
                "addr": "34",
                "op": "LOAD_CONST",
                "operands": "1 (0)",
                "comment": ""
              },
              {
                "addr": "36",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "40",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "48",
                "op": "STORE_FAST",
                "operands": "2 (cols)",
                "comment": ""
              },
              {
                "addr": "50",
                "op": "STORE_FAST",
                "operands": "1 (rows)",
                "comment": ""
              },
              {
                "addr": "52",
                "op": "LOAD_GLOBAL",
                "operands": "3 (NULL + range)",
                "comment": ""
              },
              {
                "addr": "62",
                "op": "LOAD_FAST",
                "operands": "2 (cols)",
                "comment": ""
              },
              {
                "addr": "64",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "72",
                "op": "GET_ITER",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "74",
                "op": "LOAD_FAST_AND_CLEAR",
                "operands": "3 (i)",
                "comment": ""
              },
              {
                "addr": "76",
                "op": "LOAD_FAST_AND_CLEAR",
                "operands": "4 (j)",
                "comment": ""
              },
              {
                "addr": "78",
                "op": "SWAP",
                "operands": "3",
                "comment": ""
              },
              {
                "addr": "80",
                "op": "BUILD_LIST",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "82",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "88",
                "op": "STORE_FAST",
                "operands": "3 (i)",
                "comment": ""
              },
              {
                "addr": "90",
                "op": "LOAD_GLOBAL",
                "operands": "3 (NULL + range)",
                "comment": ""
              },
              {
                "addr": "100",
                "op": "LOAD_FAST",
                "operands": "1 (rows)",
                "comment": ""
              },
              {
                "addr": "102",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "110",
                "op": "GET_ITER",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "112",
                "op": "LOAD_FAST_AND_CLEAR",
                "operands": "4 (j)",
                "comment": ""
              },
              {
                "addr": "114",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "116",
                "op": "BUILD_LIST",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "118",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "124",
                "op": "STORE_FAST",
                "operands": "4 (j)",
                "comment": ""
              },
              {
                "addr": "126",
                "op": "LOAD_FAST",
                "operands": "0 (m)",
                "comment": ""
              },
              {
                "addr": "128",
                "op": "LOAD_FAST",
                "operands": "4 (j)",
                "comment": ""
              },
              {
                "addr": "130",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "134",
                "op": "LOAD_FAST",
                "operands": "3 (i)",
                "comment": ""
              },
              {
                "addr": "136",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "140",
                "op": "LIST_APPEND",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "142",
                "op": "JUMP_BACKWARD",
                "operands": "12 (to 120)",
                "comment": ""
              },
              {
                "addr": "146",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "148",
                "op": "STORE_FAST",
                "operands": "4 (j)",
                "comment": ""
              },
              {
                "addr": "150",
                "op": "LIST_APPEND",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "152",
                "op": "JUMP_BACKWARD",
                "operands": "35 (to 84)",
                "comment": ""
              },
              {
                "addr": "156",
                "op": "SWAP",
                "operands": "3",
                "comment": ""
              },
              {
                "addr": "158",
                "op": "STORE_FAST",
                "operands": "4 (j)",
                "comment": ""
              },
              {
                "addr": "160",
                "op": "STORE_FAST",
                "operands": "3 (i)",
                "comment": ""
              },
              {
                "addr": "162",
                "op": "RETURN_VALUE",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "166",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "168",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "170",
                "op": "STORE_FAST",
                "operands": "4 (j)",
                "comment": ""
              },
              {
                "addr": "172",
                "op": "RERAISE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "176",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "178",
                "op": "SWAP",
                "operands": "3",
                "comment": ""
              },
              {
                "addr": "180",
                "op": "STORE_FAST",
                "operands": "4 (j)",
                "comment": ""
              },
              {
                "addr": "182",
                "op": "STORE_FAST",
                "operands": "3 (i)",
                "comment": ""
              },
              {
                "addr": "184",
                "op": "RERAISE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "80",
                "op": "to",
                "operands": "114 -> 174 [3]",
                "comment": ""
              },
              {
                "addr": "116",
                "op": "to",
                "operands": "144 -> 164 [6]",
                "comment": ""
              },
              {
                "addr": "146",
                "op": "to",
                "operands": "154 -> 174 [3]",
                "comment": ""
              },
              {
                "addr": "164",
                "op": "to",
                "operands": "172 -> 174 [3]",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object matrix_add at 0x7db1b63eb6e0, file \"<input>\", line 21>",
            "instructions": [
              {
                "addr": "0",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "LOAD_GLOBAL",
                "operands": "1 (NULL + range)",
                "comment": ""
              },
              {
                "addr": "12",
                "op": "LOAD_GLOBAL",
                "operands": "3 (NULL + len)",
                "comment": ""
              },
              {
                "addr": "22",
                "op": "LOAD_FAST",
                "operands": "0 (a)",
                "comment": ""
              },
              {
                "addr": "24",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "32",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "40",
                "op": "GET_ITER",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "42",
                "op": "LOAD_FAST_AND_CLEAR",
                "operands": "2 (i)",
                "comment": ""
              },
              {
                "addr": "44",
                "op": "LOAD_FAST_AND_CLEAR",
                "operands": "3 (j)",
                "comment": ""
              },
              {
                "addr": "46",
                "op": "SWAP",
                "operands": "3",
                "comment": ""
              },
              {
                "addr": "48",
                "op": "BUILD_LIST",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "50",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "56",
                "op": "STORE_FAST",
                "operands": "2 (i)",
                "comment": ""
              },
              {
                "addr": "58",
                "op": "LOAD_GLOBAL",
                "operands": "1 (NULL + range)",
                "comment": ""
              },
              {
                "addr": "68",
                "op": "LOAD_GLOBAL",
                "operands": "3 (NULL + len)",
                "comment": ""
              },
              {
                "addr": "78",
                "op": "LOAD_FAST",
                "operands": "0 (a)",
                "comment": ""
              },
              {
                "addr": "80",
                "op": "LOAD_CONST",
                "operands": "1 (0)",
                "comment": ""
              },
              {
                "addr": "82",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "86",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "94",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "102",
                "op": "GET_ITER",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "104",
                "op": "LOAD_FAST_AND_CLEAR",
                "operands": "3 (j)",
                "comment": ""
              },
              {
                "addr": "106",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "108",
                "op": "BUILD_LIST",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "110",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "116",
                "op": "STORE_FAST",
                "operands": "3 (j)",
                "comment": ""
              },
              {
                "addr": "118",
                "op": "LOAD_FAST",
                "operands": "0 (a)",
                "comment": ""
              },
              {
                "addr": "120",
                "op": "LOAD_FAST",
                "operands": "2 (i)",
                "comment": ""
              },
              {
                "addr": "122",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "126",
                "op": "LOAD_FAST",
                "operands": "3 (j)",
                "comment": ""
              },
              {
                "addr": "128",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "132",
                "op": "LOAD_FAST",
                "operands": "1 (b)",
                "comment": ""
              },
              {
                "addr": "134",
                "op": "LOAD_FAST",
                "operands": "2 (i)",
                "comment": ""
              },
              {
                "addr": "136",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "140",
                "op": "LOAD_FAST",
                "operands": "3 (j)",
                "comment": ""
              },
              {
                "addr": "142",
                "op": "BINARY_SUBSCR",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "146",
                "op": "BINARY_OP",
                "operands": "0 (+)",
                "comment": ""
              },
              {
                "addr": "150",
                "op": "LIST_APPEND",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "152",
                "op": "JUMP_BACKWARD",
                "operands": "21 (to 112)",
                "comment": ""
              },
              {
                "addr": "156",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "158",
                "op": "STORE_FAST",
                "operands": "3 (j)",
                "comment": ""
              },
              {
                "addr": "160",
                "op": "LIST_APPEND",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "162",
                "op": "JUMP_BACKWARD",
                "operands": "56 (to 52)",
                "comment": ""
              },
              {
                "addr": "166",
                "op": "SWAP",
                "operands": "3",
                "comment": ""
              },
              {
                "addr": "168",
                "op": "STORE_FAST",
                "operands": "3 (j)",
                "comment": ""
              },
              {
                "addr": "170",
                "op": "STORE_FAST",
                "operands": "2 (i)",
                "comment": ""
              },
              {
                "addr": "172",
                "op": "RETURN_VALUE",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "176",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "178",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "180",
                "op": "STORE_FAST",
                "operands": "3 (j)",
                "comment": ""
              },
              {
                "addr": "182",
                "op": "RERAISE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "186",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "188",
                "op": "SWAP",
                "operands": "3",
                "comment": ""
              },
              {
                "addr": "190",
                "op": "STORE_FAST",
                "operands": "3 (j)",
                "comment": ""
              },
              {
                "addr": "192",
                "op": "STORE_FAST",
                "operands": "2 (i)",
                "comment": ""
              },
              {
                "addr": "194",
                "op": "RERAISE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "48",
                "op": "to",
                "operands": "106 -> 184 [3]",
                "comment": ""
              },
              {
                "addr": "108",
                "op": "to",
                "operands": "154 -> 174 [6]",
                "comment": ""
              },
              {
                "addr": "156",
                "op": "to",
                "operands": "164 -> 184 [3]",
                "comment": ""
              },
              {
                "addr": "174",
                "op": "to",
                "operands": "182 -> 184 [3]",
                "comment": ""
              }
            ]
          }
        ],
        "notes": "Python bytecode via dis module."
      },
      "debugger": {
        "steps": [
          {
            "line": 24,
            "description": "Assign n = 8",
            "registers": {
              "n": "8"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 25,
            "description": "Assign a = [[i * n + j for j in range(n)] for i in ...",
            "registers": {
              "n": "8",
              "a": "[[i * n + j for j in range(n)] for i in ..."
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 26,
            "description": "Assign b = [[1 if i == j else 0 for j in range(n)] ...",
            "registers": {
              "b": "[[1 if i == j else 0 for j in range(n)] ...",
              "n": "8",
              "a": "[[i * n + j for j in range(n)] for i in ..."
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 28,
            "description": "Assign product = matrix_multiply(a, b)",
            "registers": {
              "n": "8",
              "a": "[[i * n + j for j in range(n)] for i in ...",
              "b": "[[1 if i == j else 0 for j in range(n)] ...",
              "product": "matrix_multiply(a, b)"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 29,
            "description": "Assign transposed = matrix_transpose(a)",
            "registers": {
              "transposed": "matrix_transpose(a)",
              "n": "8",
              "a": "[[i * n + j for j in range(n)] for i in ...",
              "b": "[[1 if i == j else 0 for j in range(n)] ...",
              "product": "matrix_multiply(a, b)"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 30,
            "description": "Assign summed = matrix_add(a, transposed)",
            "registers": {
              "transposed": "matrix_transpose(a)",
              "n": "8",
              "a": "[[i * n + j for j in range(n)] for i in ...",
              "summed": "matrix_add(a, transposed)",
              "b": "[[1 if i == j else 0 for j in range(n)] ...",
              "product": "matrix_multiply(a, b)"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 31,
            "description": "print(f\"A[0] = {a[0]}\")",
            "registers": {
              "transposed": "matrix_transpose(a)",
              "n": "8",
              "a": "[[i * n + j for j in range(n)] for i in ...",
              "summed": "matrix_add(a, transposed)",
              "b": "[[1 if i == j else 0 for j in range(n)] ...",
              "product": "matrix_multiply(a, b)"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 32,
            "description": "print(f\"(A*I)[0] = {product[0]}\")",
            "registers": {
              "transposed": "matrix_transpose(a)",
              "n": "8",
              "a": "[[i * n + j for j in range(n)] for i in ...",
              "summed": "matrix_add(a, transposed)",
              "b": "[[1 if i == j else 0 for j in range(n)] ...",
              "product": "matrix_multiply(a, b)"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 33,
            "description": "print(f\"(A+A^T)[0] = {summed[0]}\")",
            "registers": {
              "transposed": "matrix_transpose(a)",
              "n": "8",
              "a": "[[i * n + j for j in range(n)] for i in ...",
              "summed": "matrix_add(a, transposed)",
              "b": "[[1 if i == j else 0 for j in range(n)] ...",
              "product": "matrix_multiply(a, b)"
            },
            "stack": [
              "<module>"
            ]
          }
        ]
      },
      "compare": {
        "comparisons": []
      }
    }
  },
  {
    "id": "py-producer-consumer",
    "title": "Producer-Consumer Queue",
    "description": "Thread-safe queue with multiple producers and consumers",
    "language": "python",
    "code": "import threading\nimport queue\nimport time\nimport random\n\nPOISON_PILL = None\n\ndef producer(q, producer_id, num_items):\n    for i in range(num_items):\n        item = f\"item-{producer_id}-{i}\"\n        time.sleep(random.uniform(0.001, 0.01))\n        q.put(item)\n    q.put(POISON_PILL)\n\ndef consumer(q, consumer_id, results, lock):\n    while True:\n        item = q.get()\n        if item is POISON_PILL:\n            q.put(POISON_PILL)\n            break\n        time.sleep(random.uniform(0.001, 0.005))\n        with lock:\n            results.append((consumer_id, item))\n\nwork_queue = queue.Queue(maxsize=10)\nresults = []\nresults_lock = threading.Lock()\n\nproducers = [\n    threading.Thread(target=producer, args=(work_queue, i, 5))\n    for i in range(3)\n]\nconsumers = [\n    threading.Thread(target=consumer, args=(work_queue, i, results, results_lock))\n    for i in range(2)\n]\n\nfor t in producers + consumers:\n    t.start()\nfor t in producers:\n    t.join()\nwork_queue.put(POISON_PILL)\nfor t in consumers:\n    t.join()\n\nprint(f\"Processed {len(results)} items\")\nfor cid, item in results[:5]:\n    print(f\"  Consumer {cid}: {item}\")",
    "analysis": {
      "language": "python",
      "execution": {
        "instructions": [
          {
            "op": "CALL",
            "detail": "call producer(q, producer_id, num_items)",
            "cycles": 100
          },
          {
            "op": "LOAD",
            "detail": "load param q",
            "cycles": 1
          },
          {
            "op": "LOAD",
            "detail": "load param producer_id",
            "cycles": 1
          },
          {
            "op": "LOAD",
            "detail": "load param num_items",
            "cycles": 1
          },
          {
            "op": "STORE",
            "detail": "store return of producer",
            "cycles": 1
          },
          {
            "op": "CALL",
            "detail": "call consumer(q, consumer_id, results, lock)",
            "cycles": 100
          },
          {
            "op": "LOAD",
            "detail": "load param q",
            "cycles": 1
          },
          {
            "op": "LOAD",
            "detail": "load param consumer_id",
            "cycles": 1
          },
          {
            "op": "LOAD",
            "detail": "load param results",
            "cycles": 1
          },
          {
            "op": "LOAD",
            "detail": "load param lock",
            "cycles": 1
          },
          {
            "op": "STORE",
            "detail": "store return of consumer",
            "cycles": 1
          },
          {
            "op": "LOOP_START",
            "detail": "for loop ~100 iterations (lines 9-12)",
            "cycles": 8
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "CMP",
            "detail": "loop condition x100",
            "cycles": 500
          },
          {
            "op": "LOOP_END",
            "detail": "end for loop",
            "cycles": 0
          },
          {
            "op": "LOOP_START",
            "detail": "while loop ~100 iterations (lines 16-23)",
            "cycles": 8
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "CMP",
            "detail": "loop condition x100",
            "cycles": 500
          },
          {
            "op": "LOOP_END",
            "detail": "end while loop",
            "cycles": 0
          },
          {
            "op": "LOOP_START",
            "detail": "for loop ~100 iterations (lines 38-39)",
            "cycles": 8
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "CMP",
            "detail": "loop condition x100",
            "cycles": 500
          },
          {
            "op": "LOOP_END",
            "detail": "end for loop",
            "cycles": 0
          },
          {
            "op": "LOOP_START",
            "detail": "for loop ~100 iterations (lines 40-41)",
            "cycles": 8
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "CMP",
            "detail": "loop condition x100",
            "cycles": 500
          },
          {
            "op": "LOOP_END",
            "detail": "end for loop",
            "cycles": 0
          },
          {
            "op": "LOOP_START",
            "detail": "for loop ~100 iterations (lines 43-44)",
            "cycles": 8
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "CMP",
            "detail": "loop condition x100",
            "cycles": 500
          },
          {
            "op": "LOOP_END",
            "detail": "end for loop",
            "cycles": 0
          },
          {
            "op": "LOOP_START",
            "detail": "for loop ~100 iterations (lines 47-48)",
            "cycles": 8
          },
          {
            "op": "ADD",
            "detail": "body statement x100",
            "cycles": 700
          },
          {
            "op": "CMP",
            "detail": "loop condition x100",
            "cycles": 500
          },
          {
            "op": "LOOP_END",
            "detail": "end for loop",
            "cycles": 0
          },
          {
            "op": "ALLOC",
            "detail": "allocate list (Heap) — list with 0 elements",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~23 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~31 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate str (Heap) — string of ~25 chars",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate list_comprehension (Heap) — list comprehension (size depends on input)",
            "cycles": 20
          },
          {
            "op": "ALLOC",
            "detail": "allocate list_comprehension (Heap) — list comprehension (size depends on input)",
            "cycles": 20
          }
        ],
        "maxCycles": 11077,
        "summary": "46 pseudo-instructions, 11077 estimated cycles (2 functions, 6 loops, 6 allocations)"
      },
      "cost": {
        "lines": [
          {
            "line": 8,
            "cost": 50,
            "label": "~50 cycles"
          },
          {
            "line": 9,
            "cost": 8,
            "label": "~8 cycles"
          },
          {
            "line": 10,
            "cost": 520,
            "label": "~520 cycles"
          },
          {
            "line": 11,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 12,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 15,
            "cost": 50,
            "label": "~50 cycles"
          },
          {
            "line": 16,
            "cost": 8,
            "label": "~8 cycles"
          },
          {
            "line": 17,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 18,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 19,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 20,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 21,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 22,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 23,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 26,
            "cost": 20,
            "label": "~20 cycles"
          },
          {
            "line": 29,
            "cost": 20,
            "label": "~20 cycles"
          },
          {
            "line": 33,
            "cost": 20,
            "label": "~20 cycles"
          },
          {
            "line": 38,
            "cost": 8,
            "label": "~8 cycles"
          },
          {
            "line": 39,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 40,
            "cost": 8,
            "label": "~8 cycles"
          },
          {
            "line": 41,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 43,
            "cost": 8,
            "label": "~8 cycles"
          },
          {
            "line": 44,
            "cost": 500,
            "label": "~500 cycles"
          },
          {
            "line": 46,
            "cost": 20,
            "label": "~20 cycles"
          },
          {
            "line": 47,
            "cost": 8,
            "label": "~8 cycles"
          },
          {
            "line": 48,
            "cost": 520,
            "label": "~520 cycles"
          }
        ],
        "maxCost": 520,
        "insights": "Line 48 is the hottest at ~520 estimated cycles. 2 function(s), 6 loop(s), 6 allocation(s) contribute to the total cost."
      },
      "memory": {
        "allocations": [
          {
            "type": "heap",
            "name": "list",
            "detail": "list with 0 elements",
            "size": "~56 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~23 chars",
            "size": "~72 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~31 chars",
            "size": "~80 B"
          },
          {
            "type": "heap",
            "name": "str",
            "detail": "string of ~25 chars",
            "size": "~74 B"
          },
          {
            "type": "heap",
            "name": "list_comprehension",
            "detail": "list comprehension (size depends on input)",
            "size": "~dynamic B"
          },
          {
            "type": "heap",
            "name": "list_comprehension",
            "detail": "list comprehension (size depends on input)",
            "size": "~dynamic B"
          }
        ],
        "stackTotal": "0 B",
        "heapTotal": "282 B",
        "allocCount": 6,
        "notes": "6 heap allocations totaling ~282 B Largest: string of ~31 chars (~80 B)."
      },
      "concurrency": {
        "threads": [
          {
            "name": "main",
            "events": [
              {
                "type": "lock",
                "label": "lock context_manager_lock"
              },
              {
                "type": "unlock",
                "label": "unlock context_manager_lock"
              },
              {
                "type": "spawn",
                "label": "thread_spawn: threading.Thread(target=producer, args=(work_queue, i, 5))"
              },
              {
                "type": "spawn",
                "label": "thread_spawn: threading.Thread(target=consumer, args=(work_queue, i, resul"
              }
            ]
          },
          {
            "name": "thread-0",
            "events": [
              {
                "type": "spawn",
                "label": "threading.Thread(target=producer, args=(work_queue, i, 5))"
              }
            ]
          },
          {
            "name": "thread-1",
            "events": [
              {
                "type": "spawn",
                "label": "threading.Thread(target=consumer, args=(work_queue, i, results, results_lock))"
              }
            ]
          }
        ],
        "warnings": [],
        "analysis": "No concurrency issues detected."
      },
      "assembly": {
        "arch": "cpython-bytecode",
        "blocks": [
          {
            "label": "module",
            "instructions": [
              {
                "addr": "0",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "LOAD_CONST",
                "operands": "0 (0)",
                "comment": ""
              },
              {
                "addr": "4",
                "op": "LOAD_CONST",
                "operands": "1 (None)",
                "comment": ""
              },
              {
                "addr": "6",
                "op": "IMPORT_NAME",
                "operands": "0 (threading)",
                "comment": ""
              },
              {
                "addr": "8",
                "op": "STORE_NAME",
                "operands": "0 (threading)",
                "comment": ""
              },
              {
                "addr": "10",
                "op": "LOAD_CONST",
                "operands": "0 (0)",
                "comment": ""
              },
              {
                "addr": "12",
                "op": "LOAD_CONST",
                "operands": "1 (None)",
                "comment": ""
              },
              {
                "addr": "14",
                "op": "IMPORT_NAME",
                "operands": "1 (queue)",
                "comment": ""
              },
              {
                "addr": "16",
                "op": "STORE_NAME",
                "operands": "1 (queue)",
                "comment": ""
              },
              {
                "addr": "18",
                "op": "LOAD_CONST",
                "operands": "0 (0)",
                "comment": ""
              },
              {
                "addr": "20",
                "op": "LOAD_CONST",
                "operands": "1 (None)",
                "comment": ""
              },
              {
                "addr": "22",
                "op": "IMPORT_NAME",
                "operands": "2 (time)",
                "comment": ""
              },
              {
                "addr": "24",
                "op": "STORE_NAME",
                "operands": "2 (time)",
                "comment": ""
              },
              {
                "addr": "26",
                "op": "LOAD_CONST",
                "operands": "0 (0)",
                "comment": ""
              },
              {
                "addr": "28",
                "op": "LOAD_CONST",
                "operands": "1 (None)",
                "comment": ""
              },
              {
                "addr": "30",
                "op": "IMPORT_NAME",
                "operands": "3 (random)",
                "comment": ""
              },
              {
                "addr": "32",
                "op": "STORE_NAME",
                "operands": "3 (random)",
                "comment": ""
              },
              {
                "addr": "34",
                "op": "LOAD_CONST",
                "operands": "1 (None)",
                "comment": ""
              },
              {
                "addr": "36",
                "op": "STORE_NAME",
                "operands": "4 (POISON_PILL)",
                "comment": ""
              },
              {
                "addr": "38",
                "op": "LOAD_CONST",
                "operands": "2 (<code object producer at 0x7d2c4f2681d0, file \"<input>\", line 8>)",
                "comment": ""
              },
              {
                "addr": "40",
                "op": "MAKE_FUNCTION",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "42",
                "op": "STORE_NAME",
                "operands": "5 (producer)",
                "comment": ""
              },
              {
                "addr": "44",
                "op": "LOAD_CONST",
                "operands": "3 (<code object consumer at 0x7d2c4f218940, file \"<input>\", line 15>)",
                "comment": ""
              },
              {
                "addr": "46",
                "op": "MAKE_FUNCTION",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "48",
                "op": "STORE_NAME",
                "operands": "6 (consumer)",
                "comment": ""
              },
              {
                "addr": "50",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "52",
                "op": "LOAD_NAME",
                "operands": "1 (queue)",
                "comment": ""
              },
              {
                "addr": "54",
                "op": "LOAD_ATTR",
                "operands": "14 (Queue)",
                "comment": ""
              },
              {
                "addr": "74",
                "op": "LOAD_CONST",
                "operands": "4 (10)",
                "comment": ""
              },
              {
                "addr": "76",
                "op": "KW_NAMES",
                "operands": "5 (('maxsize',))",
                "comment": ""
              },
              {
                "addr": "78",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "86",
                "op": "STORE_NAME",
                "operands": "8 (work_queue)",
                "comment": ""
              },
              {
                "addr": "88",
                "op": "BUILD_LIST",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "90",
                "op": "STORE_NAME",
                "operands": "9 (results)",
                "comment": ""
              },
              {
                "addr": "92",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "94",
                "op": "LOAD_NAME",
                "operands": "0 (threading)",
                "comment": ""
              },
              {
                "addr": "96",
                "op": "LOAD_ATTR",
                "operands": "20 (Lock)",
                "comment": ""
              },
              {
                "addr": "116",
                "op": "CALL",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "124",
                "op": "STORE_NAME",
                "operands": "11 (results_lock)",
                "comment": ""
              },
              {
                "addr": "126",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "128",
                "op": "LOAD_NAME",
                "operands": "12 (range)",
                "comment": ""
              },
              {
                "addr": "130",
                "op": "LOAD_CONST",
                "operands": "6 (3)",
                "comment": ""
              },
              {
                "addr": "132",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "140",
                "op": "GET_ITER",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "142",
                "op": "LOAD_FAST_AND_CLEAR",
                "operands": "0 (i)",
                "comment": ""
              },
              {
                "addr": "144",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "146",
                "op": "BUILD_LIST",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "148",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "154",
                "op": "STORE_FAST",
                "operands": "0 (i)",
                "comment": ""
              },
              {
                "addr": "156",
                "op": "LOAD_NAME",
                "operands": "0 (threading)",
                "comment": ""
              },
              {
                "addr": "158",
                "op": "LOAD_ATTR",
                "operands": "27 (NULL|self + Thread)",
                "comment": ""
              },
              {
                "addr": "178",
                "op": "LOAD_NAME",
                "operands": "5 (producer)",
                "comment": ""
              },
              {
                "addr": "180",
                "op": "LOAD_NAME",
                "operands": "8 (work_queue)",
                "comment": ""
              },
              {
                "addr": "182",
                "op": "LOAD_FAST",
                "operands": "0 (i)",
                "comment": ""
              },
              {
                "addr": "184",
                "op": "LOAD_CONST",
                "operands": "7 (5)",
                "comment": ""
              },
              {
                "addr": "186",
                "op": "BUILD_TUPLE",
                "operands": "3",
                "comment": ""
              },
              {
                "addr": "188",
                "op": "KW_NAMES",
                "operands": "8 (('target', 'args'))",
                "comment": ""
              },
              {
                "addr": "190",
                "op": "CALL",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "198",
                "op": "LIST_APPEND",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "200",
                "op": "JUMP_BACKWARD",
                "operands": "26 (to 150)",
                "comment": ""
              },
              {
                "addr": "204",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "206",
                "op": "STORE_FAST",
                "operands": "0 (i)",
                "comment": ""
              },
              {
                "addr": "208",
                "op": "STORE_NAME",
                "operands": "14 (producers)",
                "comment": ""
              },
              {
                "addr": "210",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "212",
                "op": "LOAD_NAME",
                "operands": "12 (range)",
                "comment": ""
              },
              {
                "addr": "214",
                "op": "LOAD_CONST",
                "operands": "9 (2)",
                "comment": ""
              },
              {
                "addr": "216",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "224",
                "op": "GET_ITER",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "226",
                "op": "LOAD_FAST_AND_CLEAR",
                "operands": "0 (i)",
                "comment": ""
              },
              {
                "addr": "228",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "230",
                "op": "BUILD_LIST",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "232",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "238",
                "op": "STORE_FAST",
                "operands": "0 (i)",
                "comment": ""
              },
              {
                "addr": "240",
                "op": "LOAD_NAME",
                "operands": "0 (threading)",
                "comment": ""
              },
              {
                "addr": "242",
                "op": "LOAD_ATTR",
                "operands": "27 (NULL|self + Thread)",
                "comment": ""
              },
              {
                "addr": "262",
                "op": "LOAD_NAME",
                "operands": "6 (consumer)",
                "comment": ""
              },
              {
                "addr": "264",
                "op": "LOAD_NAME",
                "operands": "8 (work_queue)",
                "comment": ""
              },
              {
                "addr": "266",
                "op": "LOAD_FAST",
                "operands": "0 (i)",
                "comment": ""
              },
              {
                "addr": "268",
                "op": "LOAD_NAME",
                "operands": "9 (results)",
                "comment": ""
              },
              {
                "addr": "270",
                "op": "LOAD_NAME",
                "operands": "11 (results_lock)",
                "comment": ""
              },
              {
                "addr": "272",
                "op": "BUILD_TUPLE",
                "operands": "4",
                "comment": ""
              },
              {
                "addr": "274",
                "op": "KW_NAMES",
                "operands": "8 (('target', 'args'))",
                "comment": ""
              },
              {
                "addr": "276",
                "op": "CALL",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "284",
                "op": "LIST_APPEND",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "286",
                "op": "JUMP_BACKWARD",
                "operands": "27 (to 234)",
                "comment": ""
              },
              {
                "addr": "290",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "292",
                "op": "STORE_FAST",
                "operands": "0 (i)",
                "comment": ""
              },
              {
                "addr": "294",
                "op": "STORE_NAME",
                "operands": "15 (consumers)",
                "comment": ""
              },
              {
                "addr": "296",
                "op": "LOAD_NAME",
                "operands": "14 (producers)",
                "comment": ""
              },
              {
                "addr": "298",
                "op": "LOAD_NAME",
                "operands": "15 (consumers)",
                "comment": ""
              },
              {
                "addr": "300",
                "op": "BINARY_OP",
                "operands": "0 (+)",
                "comment": ""
              },
              {
                "addr": "304",
                "op": "GET_ITER",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "310",
                "op": "STORE_NAME",
                "operands": "16 (t)",
                "comment": ""
              },
              {
                "addr": "312",
                "op": "LOAD_NAME",
                "operands": "16 (t)",
                "comment": ""
              },
              {
                "addr": "314",
                "op": "LOAD_ATTR",
                "operands": "35 (NULL|self + start)",
                "comment": ""
              },
              {
                "addr": "334",
                "op": "CALL",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "342",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "344",
                "op": "JUMP_BACKWARD",
                "operands": "20 (to 306)",
                "comment": ""
              },
              {
                "addr": "348",
                "op": "LOAD_NAME",
                "operands": "14 (producers)",
                "comment": ""
              },
              {
                "addr": "350",
                "op": "GET_ITER",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "356",
                "op": "STORE_NAME",
                "operands": "16 (t)",
                "comment": ""
              },
              {
                "addr": "358",
                "op": "LOAD_NAME",
                "operands": "16 (t)",
                "comment": ""
              },
              {
                "addr": "360",
                "op": "LOAD_ATTR",
                "operands": "37 (NULL|self + join)",
                "comment": ""
              },
              {
                "addr": "380",
                "op": "CALL",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "388",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "390",
                "op": "JUMP_BACKWARD",
                "operands": "20 (to 352)",
                "comment": ""
              },
              {
                "addr": "394",
                "op": "LOAD_NAME",
                "operands": "8 (work_queue)",
                "comment": ""
              },
              {
                "addr": "396",
                "op": "LOAD_ATTR",
                "operands": "39 (NULL|self + put)",
                "comment": ""
              },
              {
                "addr": "416",
                "op": "LOAD_NAME",
                "operands": "4 (POISON_PILL)",
                "comment": ""
              },
              {
                "addr": "418",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "426",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "428",
                "op": "LOAD_NAME",
                "operands": "15 (consumers)",
                "comment": ""
              },
              {
                "addr": "430",
                "op": "GET_ITER",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "436",
                "op": "STORE_NAME",
                "operands": "16 (t)",
                "comment": ""
              },
              {
                "addr": "438",
                "op": "LOAD_NAME",
                "operands": "16 (t)",
                "comment": ""
              },
              {
                "addr": "440",
                "op": "LOAD_ATTR",
                "operands": "37 (NULL|self + join)",
                "comment": ""
              },
              {
                "addr": "460",
                "op": "CALL",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "468",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "470",
                "op": "JUMP_BACKWARD",
                "operands": "20 (to 432)",
                "comment": ""
              },
              {
                "addr": "474",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "476",
                "op": "LOAD_NAME",
                "operands": "20 (print)",
                "comment": ""
              },
              {
                "addr": "478",
                "op": "LOAD_CONST",
                "operands": "10 ('Processed ')",
                "comment": ""
              },
              {
                "addr": "480",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "482",
                "op": "LOAD_NAME",
                "operands": "21 (len)",
                "comment": ""
              },
              {
                "addr": "484",
                "op": "LOAD_NAME",
                "operands": "9 (results)",
                "comment": ""
              },
              {
                "addr": "486",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "494",
                "op": "FORMAT_VALUE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "496",
                "op": "LOAD_CONST",
                "operands": "11 (' items')",
                "comment": ""
              },
              {
                "addr": "498",
                "op": "BUILD_STRING",
                "operands": "3",
                "comment": ""
              },
              {
                "addr": "500",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "508",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "510",
                "op": "LOAD_NAME",
                "operands": "9 (results)",
                "comment": ""
              },
              {
                "addr": "512",
                "op": "LOAD_CONST",
                "operands": "1 (None)",
                "comment": ""
              },
              {
                "addr": "514",
                "op": "LOAD_CONST",
                "operands": "7 (5)",
                "comment": ""
              },
              {
                "addr": "516",
                "op": "BINARY_SLICE",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "518",
                "op": "GET_ITER",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "524",
                "op": "UNPACK_SEQUENCE",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "528",
                "op": "STORE_NAME",
                "operands": "22 (cid)",
                "comment": ""
              },
              {
                "addr": "530",
                "op": "STORE_NAME",
                "operands": "23 (item)",
                "comment": ""
              },
              {
                "addr": "532",
                "op": "PUSH_NULL",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "534",
                "op": "LOAD_NAME",
                "operands": "20 (print)",
                "comment": ""
              },
              {
                "addr": "536",
                "op": "LOAD_CONST",
                "operands": "12 ('  Consumer ')",
                "comment": ""
              },
              {
                "addr": "538",
                "op": "LOAD_NAME",
                "operands": "22 (cid)",
                "comment": ""
              },
              {
                "addr": "540",
                "op": "FORMAT_VALUE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "542",
                "op": "LOAD_CONST",
                "operands": "13 (': ')",
                "comment": ""
              },
              {
                "addr": "544",
                "op": "LOAD_NAME",
                "operands": "23 (item)",
                "comment": ""
              },
              {
                "addr": "546",
                "op": "FORMAT_VALUE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "548",
                "op": "BUILD_STRING",
                "operands": "4",
                "comment": ""
              },
              {
                "addr": "550",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "558",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "560",
                "op": "JUMP_BACKWARD",
                "operands": "21 (to 520)",
                "comment": ""
              },
              {
                "addr": "564",
                "op": "RETURN_CONST",
                "operands": "1 (None)",
                "comment": ""
              },
              {
                "addr": "568",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "570",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "572",
                "op": "STORE_FAST",
                "operands": "0 (i)",
                "comment": ""
              },
              {
                "addr": "574",
                "op": "RERAISE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "578",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "580",
                "op": "SWAP",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "582",
                "op": "STORE_FAST",
                "operands": "0 (i)",
                "comment": ""
              },
              {
                "addr": "584",
                "op": "RERAISE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "146",
                "op": "to",
                "operands": "202 -> 566 [2]",
                "comment": ""
              },
              {
                "addr": "230",
                "op": "to",
                "operands": "288 -> 576 [2]",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object producer at 0x7d2c4f2681d0, file \"<input>\", line 8>",
            "instructions": [
              {
                "addr": "0",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "LOAD_GLOBAL",
                "operands": "1 (NULL + range)",
                "comment": ""
              },
              {
                "addr": "12",
                "op": "LOAD_FAST",
                "operands": "2 (num_items)",
                "comment": ""
              },
              {
                "addr": "14",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "22",
                "op": "GET_ITER",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "28",
                "op": "STORE_FAST",
                "operands": "3 (i)",
                "comment": ""
              },
              {
                "addr": "30",
                "op": "LOAD_CONST",
                "operands": "1 ('item-')",
                "comment": ""
              },
              {
                "addr": "32",
                "op": "LOAD_FAST",
                "operands": "1 (producer_id)",
                "comment": ""
              },
              {
                "addr": "34",
                "op": "FORMAT_VALUE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "36",
                "op": "LOAD_CONST",
                "operands": "2 ('-')",
                "comment": ""
              },
              {
                "addr": "38",
                "op": "LOAD_FAST",
                "operands": "3 (i)",
                "comment": ""
              },
              {
                "addr": "40",
                "op": "FORMAT_VALUE",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "42",
                "op": "BUILD_STRING",
                "operands": "4",
                "comment": ""
              },
              {
                "addr": "44",
                "op": "STORE_FAST",
                "operands": "4 (item)",
                "comment": ""
              },
              {
                "addr": "46",
                "op": "LOAD_GLOBAL",
                "operands": "3 (NULL + time)",
                "comment": ""
              },
              {
                "addr": "56",
                "op": "LOAD_ATTR",
                "operands": "4 (sleep)",
                "comment": ""
              },
              {
                "addr": "76",
                "op": "LOAD_GLOBAL",
                "operands": "7 (NULL + random)",
                "comment": ""
              },
              {
                "addr": "86",
                "op": "LOAD_ATTR",
                "operands": "8 (uniform)",
                "comment": ""
              },
              {
                "addr": "106",
                "op": "LOAD_CONST",
                "operands": "3 (0.001)",
                "comment": ""
              },
              {
                "addr": "108",
                "op": "LOAD_CONST",
                "operands": "4 (0.01)",
                "comment": ""
              },
              {
                "addr": "110",
                "op": "CALL",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "118",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "126",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "128",
                "op": "LOAD_FAST",
                "operands": "0 (q)",
                "comment": ""
              },
              {
                "addr": "130",
                "op": "LOAD_ATTR",
                "operands": "11 (NULL|self + put)",
                "comment": ""
              },
              {
                "addr": "150",
                "op": "LOAD_FAST",
                "operands": "4 (item)",
                "comment": ""
              },
              {
                "addr": "152",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "160",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "162",
                "op": "JUMP_BACKWARD",
                "operands": "70 (to 24)",
                "comment": ""
              },
              {
                "addr": "166",
                "op": "LOAD_FAST",
                "operands": "0 (q)",
                "comment": ""
              },
              {
                "addr": "168",
                "op": "LOAD_ATTR",
                "operands": "11 (NULL|self + put)",
                "comment": ""
              },
              {
                "addr": "188",
                "op": "LOAD_GLOBAL",
                "operands": "12 (POISON_PILL)",
                "comment": ""
              },
              {
                "addr": "198",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "206",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "208",
                "op": "RETURN_CONST",
                "operands": "0 (None)",
                "comment": ""
              }
            ]
          },
          {
            "label": "<code object consumer at 0x7d2c4f218940, file \"<input>\", line 15>",
            "instructions": [
              {
                "addr": "0",
                "op": "RESUME",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "2",
                "op": "NOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "6",
                "op": "LOAD_ATTR",
                "operands": "1 (NULL|self + get)",
                "comment": ""
              },
              {
                "addr": "26",
                "op": "CALL",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "34",
                "op": "STORE_FAST",
                "operands": "4 (item)",
                "comment": ""
              },
              {
                "addr": "36",
                "op": "LOAD_FAST",
                "operands": "4 (item)",
                "comment": ""
              },
              {
                "addr": "38",
                "op": "LOAD_GLOBAL",
                "operands": "2 (POISON_PILL)",
                "comment": ""
              },
              {
                "addr": "48",
                "op": "IS_OP",
                "operands": "0",
                "comment": ""
              },
              {
                "addr": "50",
                "op": "POP_JUMP_IF_FALSE",
                "operands": "22 (to 96)",
                "comment": ""
              },
              {
                "addr": "52",
                "op": "LOAD_FAST",
                "operands": "0 (q)",
                "comment": ""
              },
              {
                "addr": "54",
                "op": "LOAD_ATTR",
                "operands": "5 (NULL|self + put)",
                "comment": ""
              },
              {
                "addr": "74",
                "op": "LOAD_GLOBAL",
                "operands": "2 (POISON_PILL)",
                "comment": ""
              },
              {
                "addr": "84",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "92",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "94",
                "op": "RETURN_CONST",
                "operands": "0 (None)",
                "comment": ""
              },
              {
                "addr": "106",
                "op": "LOAD_ATTR",
                "operands": "8 (sleep)",
                "comment": ""
              },
              {
                "addr": "126",
                "op": "LOAD_GLOBAL",
                "operands": "11 (NULL + random)",
                "comment": ""
              },
              {
                "addr": "136",
                "op": "LOAD_ATTR",
                "operands": "12 (uniform)",
                "comment": ""
              },
              {
                "addr": "156",
                "op": "LOAD_CONST",
                "operands": "1 (0.001)",
                "comment": ""
              },
              {
                "addr": "158",
                "op": "LOAD_CONST",
                "operands": "2 (0.005)",
                "comment": ""
              },
              {
                "addr": "160",
                "op": "CALL",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "168",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "176",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "178",
                "op": "LOAD_FAST",
                "operands": "3 (lock)",
                "comment": ""
              },
              {
                "addr": "180",
                "op": "BEFORE_WITH",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "182",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "184",
                "op": "LOAD_FAST",
                "operands": "2 (results)",
                "comment": ""
              },
              {
                "addr": "186",
                "op": "LOAD_ATTR",
                "operands": "15 (NULL|self + append)",
                "comment": ""
              },
              {
                "addr": "206",
                "op": "LOAD_FAST",
                "operands": "1 (consumer_id)",
                "comment": ""
              },
              {
                "addr": "208",
                "op": "LOAD_FAST",
                "operands": "4 (item)",
                "comment": ""
              },
              {
                "addr": "210",
                "op": "BUILD_TUPLE",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "212",
                "op": "CALL",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "220",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "222",
                "op": "LOAD_CONST",
                "operands": "0 (None)",
                "comment": ""
              },
              {
                "addr": "224",
                "op": "LOAD_CONST",
                "operands": "0 (None)",
                "comment": ""
              },
              {
                "addr": "226",
                "op": "LOAD_CONST",
                "operands": "0 (None)",
                "comment": ""
              },
              {
                "addr": "228",
                "op": "CALL",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "236",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "242",
                "op": "WITH_EXCEPT_START",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "244",
                "op": "POP_JUMP_IF_TRUE",
                "operands": "1 (to 248)",
                "comment": ""
              },
              {
                "addr": "246",
                "op": "RERAISE",
                "operands": "2",
                "comment": ""
              },
              {
                "addr": "250",
                "op": "POP_EXCEPT",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "252",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "254",
                "op": "POP_TOP",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "256",
                "op": "JUMP_BACKWARD",
                "operands": "10 (to 238)",
                "comment": ""
              },
              {
                "addr": "260",
                "op": "POP_EXCEPT",
                "operands": "",
                "comment": ""
              },
              {
                "addr": "262",
                "op": "RERAISE",
                "operands": "1",
                "comment": ""
              },
              {
                "addr": "182",
                "op": "to",
                "operands": "220 -> 240 [1] lasti",
                "comment": ""
              },
              {
                "addr": "240",
                "op": "to",
                "operands": "248 -> 258 [3] lasti",
                "comment": ""
              }
            ]
          }
        ],
        "notes": "Python bytecode via dis module."
      },
      "debugger": {
        "steps": [
          {
            "line": 1,
            "description": "import threading",
            "registers": {},
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 2,
            "description": "import queue",
            "registers": {},
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 3,
            "description": "import time",
            "registers": {},
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 4,
            "description": "import random",
            "registers": {},
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 6,
            "description": "Assign POISON_PILL = None",
            "registers": {
              "POISON_PILL": "None"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 25,
            "description": "Assign work_queue = queue.Queue(maxsize=10)",
            "registers": {
              "POISON_PILL": "None",
              "work_queue": "queue.Queue(maxsize=10)"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 26,
            "description": "Assign results = []",
            "registers": {
              "results": "[]",
              "POISON_PILL": "None",
              "work_queue": "queue.Queue(maxsize=10)"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 27,
            "description": "Assign results_lock = threading.Lock()",
            "registers": {
              "results_lock": "threading.Lock()",
              "POISON_PILL": "None",
              "results": "[]",
              "work_queue": "queue.Queue(maxsize=10)"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 29,
            "description": "Assign producers = [",
            "registers": {
              "results_lock": "threading.Lock()",
              "producers": "[",
              "POISON_PILL": "None",
              "results": "[]",
              "work_queue": "queue.Queue(maxsize=10)"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 30,
            "description": "threading.Thread(target=producer, args=(work_queue, i, 5))",
            "registers": {
              "results_lock": "threading.Lock()",
              "producers": "[",
              "POISON_PILL": "None",
              "results": "[]",
              "work_queue": "queue.Queue(maxsize=10)"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 31,
            "description": "Loop iteration 1 over range(3)",
            "registers": {
              "results_lock": "threading.Lock()",
              "producers": "[",
              "POISON_PILL": "None",
              "i": "0",
              "results": "[]",
              "work_queue": "queue.Queue(maxsize=10)"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 31,
            "description": "Loop iteration 2 over range(3)",
            "registers": {
              "results_lock": "threading.Lock()",
              "producers": "[",
              "POISON_PILL": "None",
              "i": "1",
              "results": "[]",
              "work_queue": "queue.Queue(maxsize=10)"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 31,
            "description": "Loop iteration 3 over range(3)",
            "registers": {
              "results_lock": "threading.Lock()",
              "producers": "[",
              "POISON_PILL": "None",
              "i": "2",
              "results": "[]",
              "work_queue": "queue.Queue(maxsize=10)"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 32,
            "description": "]",
            "registers": {
              "results_lock": "threading.Lock()",
              "producers": "[",
              "POISON_PILL": "None",
              "i": "2",
              "results": "[]",
              "work_queue": "queue.Queue(maxsize=10)"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 33,
            "description": "Assign consumers = [",
            "registers": {
              "results_lock": "threading.Lock()",
              "producers": "[",
              "POISON_PILL": "None",
              "i": "2",
              "results": "[]",
              "consumers": "[",
              "work_queue": "queue.Queue(maxsize=10)"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 34,
            "description": "threading.Thread(target=consumer, args=(work_queue, i, results, results_lock))",
            "registers": {
              "results_lock": "threading.Lock()",
              "producers": "[",
              "POISON_PILL": "None",
              "i": "2",
              "results": "[]",
              "consumers": "[",
              "work_queue": "queue.Queue(maxsize=10)"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 35,
            "description": "Loop iteration 1 over range(2)",
            "registers": {
              "producers": "[",
              "results": "[]",
              "results_lock": "threading.Lock()",
              "work_queue": "queue.Queue(maxsize=10)",
              "POISON_PILL": "None",
              "i": "0",
              "consumers": "["
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 35,
            "description": "Loop iteration 2 over range(2)",
            "registers": {
              "producers": "[",
              "results": "[]",
              "results_lock": "threading.Lock()",
              "work_queue": "queue.Queue(maxsize=10)",
              "POISON_PILL": "None",
              "i": "1",
              "consumers": "["
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 36,
            "description": "]",
            "registers": {
              "producers": "[",
              "results": "[]",
              "results_lock": "threading.Lock()",
              "work_queue": "queue.Queue(maxsize=10)",
              "POISON_PILL": "None",
              "i": "1",
              "consumers": "["
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 38,
            "description": "Loop iteration 1 over producers + consumers",
            "registers": {
              "producers": "[",
              "results": "[]",
              "results_lock": "threading.Lock()",
              "work_queue": "queue.Queue(maxsize=10)",
              "POISON_PILL": "None",
              "t": "0",
              "i": "1",
              "consumers": "["
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 39,
            "description": "  t.start()",
            "registers": {
              "producers": "[",
              "results": "[]",
              "results_lock": "threading.Lock()",
              "work_queue": "queue.Queue(maxsize=10)",
              "POISON_PILL": "None",
              "t": "0",
              "i": "1",
              "consumers": "["
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 38,
            "description": "Loop iteration 2 over producers + consumers",
            "registers": {
              "producers": "[",
              "results": "[]",
              "results_lock": "threading.Lock()",
              "work_queue": "queue.Queue(maxsize=10)",
              "POISON_PILL": "None",
              "t": "1",
              "i": "1",
              "consumers": "["
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 39,
            "description": "  t.start()",
            "registers": {
              "producers": "[",
              "results": "[]",
              "results_lock": "threading.Lock()",
              "work_queue": "queue.Queue(maxsize=10)",
              "POISON_PILL": "None",
              "t": "1",
              "i": "1",
              "consumers": "["
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 38,
            "description": "Loop iteration 3 over producers + consumers",
            "registers": {
              "producers": "[",
              "results": "[]",
              "results_lock": "threading.Lock()",
              "work_queue": "queue.Queue(maxsize=10)",
              "POISON_PILL": "None",
              "t": "2",
              "i": "1",
              "consumers": "["
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 39,
            "description": "  t.start()",
            "registers": {
              "producers": "[",
              "results": "[]",
              "results_lock": "threading.Lock()",
              "work_queue": "queue.Queue(maxsize=10)",
              "POISON_PILL": "None",
              "t": "2",
              "i": "1",
              "consumers": "["
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 40,
            "description": "Loop iteration 1 over producers",
            "registers": {
              "producers": "[",
              "results": "[]",
              "results_lock": "threading.Lock()",
              "work_queue": "queue.Queue(maxsize=10)",
              "POISON_PILL": "None",
              "t": "0",
              "i": "1",
              "consumers": "["
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 41,
            "description": "  t.join()",
            "registers": {
              "producers": "[",
              "results": "[]",
              "results_lock": "threading.Lock()",
              "work_queue": "queue.Queue(maxsize=10)",
              "POISON_PILL": "None",
              "t": "0",
              "i": "1",
              "consumers": "["
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 40,
            "description": "Loop iteration 2 over producers",
            "registers": {
              "producers": "[",
              "results": "[]",
              "results_lock": "threading.Lock()",
              "work_queue": "queue.Queue(maxsize=10)",
              "POISON_PILL": "None",
              "t": "1",
              "i": "1",
              "consumers": "["
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 41,
            "description": "  t.join()",
            "registers": {
              "producers": "[",
              "results": "[]",
              "results_lock": "threading.Lock()",
              "work_queue": "queue.Queue(maxsize=10)",
              "POISON_PILL": "None",
              "t": "1",
              "i": "1",
              "consumers": "["
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 40,
            "description": "Loop iteration 3 over producers",
            "registers": {
              "producers": "[",
              "results": "[]",
              "results_lock": "threading.Lock()",
              "work_queue": "queue.Queue(maxsize=10)",
              "POISON_PILL": "None",
              "t": "2",
              "i": "1",
              "consumers": "["
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 41,
            "description": "  t.join()",
            "registers": {
              "producers": "[",
              "results": "[]",
              "results_lock": "threading.Lock()",
              "work_queue": "queue.Queue(maxsize=10)",
              "POISON_PILL": "None",
              "t": "2",
              "i": "1",
              "consumers": "["
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 42,
            "description": "work_queue.put(POISON_PILL)",
            "registers": {
              "producers": "[",
              "results": "[]",
              "results_lock": "threading.Lock()",
              "work_queue": "queue.Queue(maxsize=10)",
              "POISON_PILL": "None",
              "t": "2",
              "i": "1",
              "consumers": "["
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 43,
            "description": "Loop iteration 1 over consumers",
            "registers": {
              "producers": "[",
              "results": "[]",
              "results_lock": "threading.Lock()",
              "work_queue": "queue.Queue(maxsize=10)",
              "POISON_PILL": "None",
              "t": "0",
              "i": "1",
              "consumers": "["
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 44,
            "description": "  t.join()",
            "registers": {
              "producers": "[",
              "results": "[]",
              "results_lock": "threading.Lock()",
              "work_queue": "queue.Queue(maxsize=10)",
              "POISON_PILL": "None",
              "t": "0",
              "i": "1",
              "consumers": "["
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 43,
            "description": "Loop iteration 2 over consumers",
            "registers": {
              "producers": "[",
              "results": "[]",
              "results_lock": "threading.Lock()",
              "work_queue": "queue.Queue(maxsize=10)",
              "POISON_PILL": "None",
              "t": "1",
              "i": "1",
              "consumers": "["
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 44,
            "description": "  t.join()",
            "registers": {
              "producers": "[",
              "results": "[]",
              "results_lock": "threading.Lock()",
              "work_queue": "queue.Queue(maxsize=10)",
              "POISON_PILL": "None",
              "t": "1",
              "i": "1",
              "consumers": "["
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 43,
            "description": "Loop iteration 3 over consumers",
            "registers": {
              "producers": "[",
              "results": "[]",
              "results_lock": "threading.Lock()",
              "work_queue": "queue.Queue(maxsize=10)",
              "POISON_PILL": "None",
              "t": "2",
              "i": "1",
              "consumers": "["
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 44,
            "description": "  t.join()",
            "registers": {
              "producers": "[",
              "results": "[]",
              "results_lock": "threading.Lock()",
              "work_queue": "queue.Queue(maxsize=10)",
              "POISON_PILL": "None",
              "t": "2",
              "i": "1",
              "consumers": "["
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 46,
            "description": "print(f\"Processed {len(results)} items\")",
            "registers": {
              "producers": "[",
              "results": "[]",
              "results_lock": "threading.Lock()",
              "work_queue": "queue.Queue(maxsize=10)",
              "POISON_PILL": "None",
              "t": "2",
              "i": "1",
              "consumers": "["
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 47,
            "description": "Loop iteration 1 over results[:5]",
            "registers": {
              "producers": "[",
              "results": "[]",
              "results_lock": "threading.Lock()",
              "work_queue": "queue.Queue(maxsize=10)",
              "POISON_PILL": "None",
              "t": "2",
              "i": "1",
              "consumers": "[",
              "cid, item": "0"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 48,
            "description": "  print(f\"  Consumer {cid}: {item}\")",
            "registers": {
              "producers": "[",
              "results": "[]",
              "results_lock": "threading.Lock()",
              "work_queue": "queue.Queue(maxsize=10)",
              "POISON_PILL": "None",
              "t": "2",
              "i": "1",
              "consumers": "[",
              "cid, item": "0"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 47,
            "description": "Loop iteration 2 over results[:5]",
            "registers": {
              "producers": "[",
              "results": "[]",
              "results_lock": "threading.Lock()",
              "work_queue": "queue.Queue(maxsize=10)",
              "POISON_PILL": "None",
              "t": "2",
              "i": "1",
              "consumers": "[",
              "cid, item": "1"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 48,
            "description": "  print(f\"  Consumer {cid}: {item}\")",
            "registers": {
              "producers": "[",
              "results": "[]",
              "results_lock": "threading.Lock()",
              "work_queue": "queue.Queue(maxsize=10)",
              "POISON_PILL": "None",
              "t": "2",
              "i": "1",
              "consumers": "[",
              "cid, item": "1"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 47,
            "description": "Loop iteration 3 over results[:5]",
            "registers": {
              "producers": "[",
              "results": "[]",
              "results_lock": "threading.Lock()",
              "work_queue": "queue.Queue(maxsize=10)",
              "POISON_PILL": "None",
              "t": "2",
              "i": "1",
              "consumers": "[",
              "cid, item": "2"
            },
            "stack": [
              "<module>"
            ]
          },
          {
            "line": 48,
            "description": "  print(f\"  Consumer {cid}: {item}\")",
            "registers": {
              "producers": "[",
              "results": "[]",
              "results_lock": "threading.Lock()",
              "work_queue": "queue.Queue(maxsize=10)",
              "POISON_PILL": "None",
              "t": "2",
              "i": "1",
              "consumers": "[",
              "cid, item": "2"
            },
            "stack": [
              "<module>"
            ]
          }
        ]
      },
      "compare": {
        "comparisons": []
      }
    }
  }
];

export const DEFAULT_EXAMPLE_ID = "py-threading";
