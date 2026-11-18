// Additions to questions 61-150: a closing interview tip for every answer, and a worked, runnable
// code example for the code-relevant questions that did not have one. index.js merges these into
// the items (tip appended to the answer, code and lang added), so the item shape stays the same.
const C = String.raw;

export const TIPS = {
  61: "Use one everyday analogy (blueprint and houses, or design and cars) and then show three lines of code. Interviewers want both the idea and the syntax.",
  62: "Keep each pillar to one sentence plus one real example; reciting long definitions sounds memorised.",
  63: "Say what can go wrong without encapsulation (a negative balance) before showing the fix. The problem makes the concept memorable.",
  64: "Mention that Java has no multiple inheritance of classes and why: it avoids the diamond problem.",
  65: "Remember the pairing: overloading is compile-time polymorphism, overriding is run-time polymorphism. That one line is usually the follow-up.",
  66: "Give the rule of thumb: abstract class for shared code in an is-a family, interface for a capability that unrelated classes share.",
  67: "Show a loop that calls the same method on different objects. That single picture is what polymorphism means.",
  68: "Name a case where inheritance is right (a true is-a relationship) as well as where composition is better. A balanced answer scores higher.",
  69: "Pick one principle, usually single responsibility or dependency inversion, and give a before-and-after example. Depth beats a list of five acronyms.",
  70: "Mention constructor chaining (this(...) in Java, super().__init__ in Python) as a natural follow-on.",
  71: "Give a concrete example of something that should be static (a counter of all objects, a utility method) and something that must not be.",
  72: "Name only patterns you have actually used or can sketch, such as Singleton, Factory, Observer and Strategy, and say the problem each one solves.",
  73: "After any coding answer, state its Big-O time and space without being asked. It is expected in product-company interviews.",
  74: "Mention cache locality: arrays are often faster in practice even when the Big-O is equal, because their memory is contiguous.",
  75: "Solve balanced brackets with a stack on the spot. It is the most common follow-up to this question.",
  76: "Explain load factor and resizing: when the table gets too full it doubles in size, which keeps operations O(1) on average.",
  77: "Say that an in-order traversal of a BST gives sorted output. Interviewers often ask how to validate a BST, and that fact is the key.",
  78: "Link heaps to real problems: top K elements, merging K sorted lists, and Dijkstra's shortest path all use a heap.",
  79: "State the rule: BFS for shortest path in an unweighted graph, DFS for exploring all paths, cycles and connected components.",
  80: "Always say the base case first when you write recursion, and mention the risk of stack overflow for very deep recursion.",
  81: "Describe the process: define the state, write the recurrence, then decide between memoization and a table.",
  82: "Mention which sorts are stable and which Python and Java actually use (Timsort). Those are the expected follow-ups.",
  83: "Watch the boundaries: loop while low <= high and compute the middle as low + (high - low) // 2. Off-by-one bugs are what interviewers test here.",
  84: "Before writing code, say why the technique applies: sorted input suggests two pointers, a contiguous subarray suggests a sliding window.",
  85: "Compare a trie with a hash set: both find whole words fast, but only a trie answers prefix questions efficiently.",
  86: "Give a counterexample where greedy fails, such as coins 1, 3 and 4 for amount 6. Showing failure proves you understand when to use it.",
  87: "Mention that threads share the heap but each has its own stack. It explains both why threads are cheap and why they need locks.",
  88: "Name the four Coffman conditions in order and say that breaking any one prevents deadlock.",
  89: "Be ready to compute average waiting time for a small example by hand; it is a common written-round question.",
  90: "Explain why virtual memory helps: isolation between processes, programs bigger than RAM, and simpler memory management.",
  91: "Use the analogy: a mutex is a single key to one room, a counting semaphore is a parking lot with N spaces.",
  92: "Show the lost-update example with two threads incrementing a counter. A concrete race is far more convincing than a definition.",
  93: "Mention that thread switches within a process are cheaper than process switches because the address space stays the same.",
  94: "Give an example of a system call your own code makes, such as reading a file, to show you understand where the boundary is.",
  95: "Connect thrashing to the working set: the fix is to keep each process's working set in memory or run fewer processes.",
  96: "Pair each type with its cause: internal with fixed-size blocks, external with variable-size blocks.",
  97: "Map familiar protocols to layers (HTTP application, TCP transport, IP network, Ethernet data link). The mapping is what interviewers check.",
  98: "Give one example application for each, and mention that HTTP/3 runs on QUIC over UDP. It shows current knowledge.",
  99: "Also mention the four-step connection close (FIN, ACK, FIN, ACK). It is the natural follow-up.",
  100: "Name the record types: A for IPv4, AAAA for IPv6, CNAME for aliases, MX for mail. It shows hands-on familiarity.",
  101: "Say that HTTPS protects data in transit only; the server still has to store data securely.",
  102: "Practise the quick calculation: a /26 has 64 addresses and 62 usable hosts. Expect at least one subnet calculation.",
  103: "Mention dual stack, the way IPv4 and IPv6 run side by side today.",
  104: "Remember a handful of well-known ports by heart: 22, 53, 80, 443, 3306 and 5432 come up most often.",
  105: "Mention health checks and the common algorithms (round robin, least connections, IP hash) for load balancers.",
  106: "Name the anomaly each level prevents: dirty read, non-repeatable read, phantom read. A small table in your head makes this easy.",
  107: "Say why you would use each: replication for read scaling and high availability, sharding for write scaling and data size.",
  108: "Explain that during a network partition you must choose consistency or availability, and give one example system for each choice.",
  109: "Mention the drawbacks too: business logic hidden in the database is harder to test, version and debug.",
  110: "Say that a table can have only one clustered index because the rows can be physically ordered only one way.",
  111: "Say clearly that escaping by hand is not the fix; parameterised queries are. That is the expected answer.",
  112: "Mention that list comprehensions are usually preferred over map and filter in Python for readability.",
  113: "Show that a for loop calls iter() and then next() until StopIteration. It explains both terms at once.",
  114: "Name real context managers you use: open(), threading.Lock() and database transactions.",
  115: "Give alternative constructors (such as from_string) as the classic use of @classmethod.",
  116: "Mention both mechanisms: reference counting frees most objects immediately, and the cyclic garbage collector handles reference cycles.",
  117: "Explain why NumPy is faster: contiguous memory, one fixed type and vectorised C loops.",
  118: "Mention the temporal dead zone for let and const by name. It is the detail most candidates skip.",
  119: "Walk through the four rules in order of priority: new, explicit binding (call, apply, bind), method call, then default binding.",
  120: "Mention that the class keyword in JavaScript is syntax on top of prototypes, not a different inheritance model.",
  121: "Give a real use for each: debounce a search box, throttle a scroll or resize handler.",
  122: "Use x == null as the one accepted shortcut for checking both null and undefined.",
  123: "Say when not to use an arrow function: as an object method that needs this, or as a constructor.",
  124: "Mention where you would store the token (an HttpOnly cookie) and how you would handle expiry (short-lived access token plus refresh token).",
  125: "Pair each attack with its main defence: output escaping and a Content Security Policy for XSS, SameSite cookies and CSRF tokens for CSRF.",
  126: "Mention lifting state up: when two siblings need the same data, move the state to their common parent and pass it down as props.",
  127: "Say that most forms in React use controlled components, and file inputs are the classic uncontrolled exception.",
  128: "Mention that features must be scaled before PCA, and that you choose the number of components from the explained variance.",
  129: "Mention how to choose k (elbow method or silhouette score) and that k-means assumes roughly round clusters of similar size.",
  130: "Say that logistic regression is a classification model despite its name. It is a common trick question.",
  131: "Mention stratified folds for classification and time-based splits for time series.",
  132: "Name one algorithm for each: random forest for bagging; AdaBoost, XGBoost or LightGBM for boosting.",
  133: "Start with the metric: on imbalanced data, report precision, recall or PR-AUC instead of accuracy.",
  134: "Say that most real systems scale vertically first because it is simple, then horizontally when they hit limits.",
  135: "Name the invalidation strategy you would use, and mention the famous line: cache invalidation is one of the two hard problems in computer science.",
  136: "Avoid saying microservices are always better; say a small team usually starts with a well-structured monolith.",
  137: "Mention the trade-off: GraphQL fixes over-fetching but makes HTTP caching and rate limiting harder.",
  138: "State the golden rule: never rebase commits that others have already pulled.",
  139: "Say that containers share the host kernel, which is why they start in seconds while VMs take minutes.",
  140: "Describe the pipeline of a project you know: run tests on every push, build an image, deploy to staging, then production.",
  141: "Mention at-least-once delivery and why consumers must therefore be idempotent.",
  142: "Do a quick estimate first, such as 100 million URLs and 7 Base62 characters, before drawing boxes. Interviewers grade the structure.",
  143: "Mention the testing pyramid: many unit tests, fewer integration tests, a small number of end-to-end tests.",
  144: "Describe one sprint ritual you have actually taken part in, such as a stand-up or a retrospective, even from a college project.",
  145: "Keep it to about 90 seconds and end with why you are interested in this role, which leads naturally into the next question.",
  146: "Choose a real weakness that does not block the job, and spend most of the time on what you are doing to improve it.",
  147: "Link two or three of your strengths directly to items in the job description.",
  148: "Prepare four or five STAR stories in advance; each can answer several different behavioural questions.",
  149: "Show ambition that fits the company: growing deeper in the role and taking on more responsibility, not leaving to start something else.",
  150: "Prepare two or three questions about the team, the work and how success is measured; avoid asking about salary in the first round."
};

export const EXTRA_CODE = {
  73: { code: C`
def constant(items):              # O(1): one step, whatever the size
    return items[0]

def linear(items, target):        # O(n): may look at every item
    return any(x == target for x in items)

def quadratic(items):             # O(n^2): every pair
    return [(a, b) for i, a in enumerate(items) for b in items[i + 1:] if a + b == 10]

def logarithmic(n):               # O(log n): the problem halves each step
    steps = 0
    while n > 1:
        n //= 2
        steps += 1
    return steps

data = list(range(1, 10))
print(constant(data), linear(data, 7), quadratic(data))
print("halvings for 1,000,000:", logarithmic(1_000_000))   # about 20` },

  74: { code: C`
class Node:
    def __init__(self, value, next=None):
        self.value, self.next = value, next

class LinkedList:
    def __init__(self):
        self.head = None

    def push_front(self, value):          # O(1): no shifting
        self.head = Node(value, self.head)

    def get(self, index):                 # O(n): walk from the head
        node = self.head
        for _ in range(index):
            node = node.next
        return node.value

    def __iter__(self):
        node = self.head
        while node:
            yield node.value
            node = node.next

arr = [20, 30, 40]
arr.insert(0, 10)                         # O(n): every element shifts right
print(arr, arr[2])                        # index access is O(1)

lst = LinkedList()
for v in (40, 30, 20, 10):
    lst.push_front(v)
print(list(lst), lst.get(2))` },

  75: { code: C`
from collections import deque

def is_balanced(text):                     # classic stack problem
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in text:
        if ch in "([{":
            stack.append(ch)               # push
        elif ch in pairs:
            if not stack or stack.pop() != pairs[ch]:   # pop must match
                return False
    return not stack

print(is_balanced("{[a + b] * (c - d)}"), is_balanced("(]"))   # True False

print_queue = deque(["report.pdf", "photo.png"])    # FIFO
print_queue.append("notes.txt")                     # join at the back
print(print_queue.popleft(), list(print_queue))     # served from the front` },

  76: { code: C`
class HashTable:
    """Separate chaining: each bucket is a list of (key, value) pairs."""
    def __init__(self, size=8):
        self.buckets = [[] for _ in range(size)]
        self.count = 0

    def _bucket(self, key):
        return self.buckets[hash(key) % len(self.buckets)]

    def put(self, key, value):
        bucket = self._bucket(key)
        for i, (k, _) in enumerate(bucket):
            if k == key:
                bucket[i] = (key, value)       # update existing key
                return
        bucket.append((key, value))            # new key (maybe a collision)
        self.count += 1
        if self.count / len(self.buckets) > 0.75:
            self._resize()                     # keep chains short

    def get(self, key):
        for k, v in self._bucket(key):
            if k == key:
                return v
        raise KeyError(key)

    def _resize(self):
        old = [pair for bucket in self.buckets for pair in bucket]
        self.buckets = [[] for _ in range(len(self.buckets) * 2)]
        self.count = 0
        for k, v in old:
            self.put(k, v)

table = HashTable()
for i, city in enumerate(["Pune", "Delhi", "Goa", "Agra", "Ooty", "Kochi", "Surat"]):
    table.put(city, i)
print(table.get("Goa"), len(table.buckets), max(len(b) for b in table.buckets))` },

  77: { code: C`
class TreeNode:
    def __init__(self, key):
        self.key, self.left, self.right = key, None, None

def insert(node, key):
    if node is None:
        return TreeNode(key)
    if key < node.key:
        node.left = insert(node.left, key)
    else:
        node.right = insert(node.right, key)
    return node

def search(node, key):
    while node and node.key != key:          # go left or right, never both
        node = node.left if key < node.key else node.right
    return node is not None

def inorder(node):                           # left, root, right = sorted order
    return inorder(node.left) + [node.key] + inorder(node.right) if node else []

root = None
for k in [50, 30, 70, 20, 40, 60, 80]:
    root = insert(root, k)
print(search(root, 60), search(root, 65))    # True False
print(inorder(root))                         # [20, 30, 40, 50, 60, 70, 80]` },

  78: { code: C`
import heapq

tasks = []
heapq.heappush(tasks, (2, "reply to recruiter"))    # (priority, task)
heapq.heappush(tasks, (1, "fix production bug"))
heapq.heappush(tasks, (3, "update resume"))
while tasks:
    priority, task = heapq.heappop(tasks)           # always the smallest first
    print(priority, task)

scores = [88, 92, 75, 99, 64, 91, 85]
print(heapq.nlargest(3, scores))                    # top K with a heap

def top_k(nums, k):                                 # keep a min-heap of size k: O(n log k)
    heap = []
    for x in nums:
        heapq.heappush(heap, x)
        if len(heap) > k:
            heapq.heappop(heap)                     # drop the smallest
    return sorted(heap, reverse=True)
print(top_k(scores, 3))` },

  82: { code: C`
def insertion_sort(a):
    a = a[:]
    for i in range(1, len(a)):
        key, j = a[i], i - 1
        while j >= 0 and a[j] > key:        # shift bigger items right
            a[j + 1] = a[j]
            j -= 1
        a[j + 1] = key
    return a

def counting_sort(a, max_value):            # O(n + k) for small integer ranges
    counts = [0] * (max_value + 1)
    for x in a:
        counts[x] += 1
    return [v for v, c in enumerate(counts) for _ in range(c)]

marks = [7, 3, 9, 3, 1, 8, 2]
print(insertion_sort(marks), counting_sort(marks, 9))

students = [("Asha", 85), ("Ravi", 72), ("Meera", 85), ("Kiran", 72)]
print(sorted(students, key=lambda s: s[1]))   # Timsort is stable: Ravi stays before Kiran` },

  83: { code: C`
def binary_search(nums, target):
    low, high = 0, len(nums) - 1
    while low <= high:
        mid = low + (high - low) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            low = mid + 1                  # target is in the right half
        else:
            high = mid - 1                 # target is in the left half
    return -1

def min_daily_capacity(packages, days):    # binary search on the answer
    def can_ship(cap):
        needed, load = 1, 0
        for p in packages:
            if load + p > cap:
                needed, load = needed + 1, 0
            load += p
        return needed <= days
    low, high = max(packages), sum(packages)
    while low < high:
        mid = (low + high) // 2
        if can_ship(mid):
            high = mid                     # works: try smaller
        else:
            low = mid + 1
    return low

print(binary_search([3, 8, 15, 21, 42, 57], 21))           # 3
print(min_daily_capacity([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5))   # 15` },

  84: { code: C`
def pair_with_sum(sorted_nums, target):            # two pointers from both ends
    left, right = 0, len(sorted_nums) - 1
    while left < right:
        s = sorted_nums[left] + sorted_nums[right]
        if s == target:
            return sorted_nums[left], sorted_nums[right]
        if s < target:
            left += 1
        else:
            right -= 1
    return None

def longest_unique_substring(s):                   # sliding window
    last_seen, start, best = {}, 0, 0
    for end, ch in enumerate(s):
        if ch in last_seen and last_seen[ch] >= start:
            start = last_seen[ch] + 1              # shrink past the repeat
        last_seen[ch] = end
        best = max(best, end - start + 1)
    return best

print(pair_with_sum([1, 3, 4, 6, 8, 11], 10))      # (4, 6)
print(longest_unique_substring("abcabcbb"))        # 3 ("abc")` },

  85: { code: C`
class Trie:
    def __init__(self):
        self.root = {}

    def insert(self, word):
        node = self.root
        for ch in word:
            node = node.setdefault(ch, {})
        node["$end"] = True                      # marks a complete word

    def _walk(self, prefix):
        node = self.root
        for ch in prefix:
            if ch not in node:
                return None
            node = node[ch]
        return node

    def autocomplete(self, prefix):
        node, results = self._walk(prefix), []
        def collect(n, path):
            if "$end" in n:
                results.append(prefix + path)
            for ch, child in sorted(n.items()):
                if ch != "$end":
                    collect(child, path + ch)
        if node:
            collect(node, "")
        return results

t = Trie()
for w in ["python", "pandas", "pytest", "java", "pyspark"]:
    t.insert(w)
print(t.autocomplete("py"))      # ['pyspark', 'pytest', 'python']
print(t.autocomplete("ja"), t.autocomplete("go"))` },

  86: { code: C`
def greedy_coins(coins, amount):
    count = 0
    for c in sorted(coins, reverse=True):     # always take the biggest coin
        count += amount // c
        amount %= c
    return count if amount == 0 else None

def dp_coins(coins, amount):                  # optimal answer by dynamic programming
    best = [0] + [float("inf")] * amount
    for a in range(1, amount + 1):
        best[a] = min((best[a - c] + 1 for c in coins if c <= a), default=float("inf"))
    return best[amount]

def max_meetings(meetings):                   # greedy that IS optimal: earliest end first
    chosen, free_at = [], 0
    for start, end in sorted(meetings, key=lambda m: m[1]):
        if start >= free_at:
            chosen.append((start, end))
            free_at = end
    return chosen

print(greedy_coins([1, 3, 4], 6), dp_coins([1, 3, 4], 6))   # 3 vs 2: greedy fails here
print(max_meetings([(1, 4), (3, 5), (0, 6), (5, 7), (8, 9), (5, 9)]))` },

  87: { code: C`
import threading
from multiprocessing import Process, Value

counter = {"n": 0}

def bump():
    counter["n"] += 1            # threads see the same dict

def bump_in_process(shared, plain):
    plain["n"] += 1              # changes only this process's copy
    with shared.get_lock():
        shared.value += 1        # explicit shared memory is needed

if __name__ == "__main__":
    threads = [threading.Thread(target=bump) for _ in range(3)]
    for t in threads: t.start()
    for t in threads: t.join()
    print("after 3 threads:", counter["n"])             # 3: memory is shared

    shared, plain = Value("i", 0), {"n": 0}
    procs = [Process(target=bump_in_process, args=(shared, plain)) for _ in range(3)]
    for p in procs: p.start()
    for p in procs: p.join()
    print("after 3 processes:", plain["n"], "| shared value:", shared.value)   # 0 | 3` },

  89: { code: C`
def fcfs(jobs):
    time, waits = 0, {}
    for name, burst in jobs:
        waits[name] = time
        time += burst
    return waits

def sjf(jobs):                                   # all arrive at time 0
    return fcfs(sorted(jobs, key=lambda j: j[1]))

def round_robin(jobs, quantum):
    remaining = dict(jobs)
    finish, time, queue = {}, 0, [name for name, _ in jobs]
    while queue:
        name = queue.pop(0)
        run = min(quantum, remaining[name])
        time += run
        remaining[name] -= run
        if remaining[name]:
            queue.append(name)                   # back of the line
        else:
            finish[name] = time
    return {n: finish[n] - b for n, b in jobs}   # waiting = finish - burst

jobs = [("P1", 24), ("P2", 3), ("P3", 3)]
for label, waits in [("FCFS", fcfs(jobs)), ("SJF", sjf(jobs)), ("RR q=4", round_robin(jobs, 4))]:
    print(f"{label:7} waits={waits} average={sum(waits.values()) / len(waits):.2f}")
# FCFS 17.00 (convoy effect), SJF 3.00, RR 5.67` },

  91: { code: C`
import threading
import time

db_connections = threading.Semaphore(2)     # counting semaphore: at most 2 at once
print_lock = threading.Lock()               # mutex: one thread at a time
active = []

def run_query(user):
    with db_connections:                    # wait() ... signal()
        with print_lock:
            active.append(user)
            print(f"{user} connected, active={active}")
        time.sleep(0.05)
        with print_lock:
            active.remove(user)

threads = [threading.Thread(target=run_query, args=(f"user{i}",)) for i in range(5)]
for t in threads: t.start()
for t in threads: t.join()
print("never more than 2 connections were active at the same time")` },

  92: { code: C`
import threading
import time

class Counter:
    def __init__(self):
        self.value = 0
        self.lock = threading.Lock()

    def unsafe_add(self, times):
        for _ in range(times):
            current = self.value        # read
            time.sleep(0)               # let another thread run here, as a real scheduler might
            self.value = current + 1    # write: may overwrite another thread's update

    def safe_add(self, times):
        for _ in range(times):
            with self.lock:             # read-modify-write is now atomic
                current = self.value
                time.sleep(0)
                self.value = current + 1

def run(method_name):
    c = Counter()
    threads = [threading.Thread(target=getattr(c, method_name), args=(2_000,)) for _ in range(4)]
    for t in threads: t.start()
    for t in threads: t.join()
    return c.value

print("without lock:", run("unsafe_add"), "(expected 8000, updates were lost)")
print("with lock:   ", run("safe_add"))` },

  100: { code: C`
import socket

# Resolve names the way a browser does: ask the OS resolver for addresses
for host in ("localhost", "example.com"):
    try:
        infos = socket.getaddrinfo(host, 443, proto=socket.IPPROTO_TCP)
        addresses = sorted({info[4][0] for info in infos})
        print(f"{host:12} -> {addresses}")
    except socket.gaierror as err:
        print(f"{host:12} -> lookup failed ({err})")   # e.g. no network` },

  102: { code: C`
import ipaddress

net = ipaddress.ip_network("192.168.10.0/26")
print("mask:", net.netmask, "| addresses:", net.num_addresses, "| usable hosts:", net.num_addresses - 2)
print("network:", net.network_address, "| broadcast:", net.broadcast_address)
print("first and last host:", list(net.hosts())[0], list(net.hosts())[-1])

print(ipaddress.ip_address("192.168.10.45") in net)       # True
print(ipaddress.ip_address("192.168.10.70") in net)       # False

# Split a /24 into four /26 subnets
for subnet in ipaddress.ip_network("10.0.5.0/24").subnets(new_prefix=26):
    print(subnet)` },

  116: { code: C`
import gc
import sys

data = [1, 2, 3]
print("references to data:", sys.getrefcount(data) - 1)   # minus the temporary argument
alias = data
print("after alias:", sys.getrefcount(data) - 1)
del alias
print("after del:", sys.getrefcount(data) - 1)

class Node:
    def __init__(self):
        self.partner = None

a, b = Node(), Node()
a.partner, b.partner = b, a            # a reference cycle
del a, b                               # refcounts never reach zero on their own
print("objects freed by the cyclic collector:", gc.collect() >= 2)

print("size of a small int object:", sys.getsizeof(1), "bytes")` },

  117: { code: C`
import time
import numpy as np

n = 1_000_000
py_list = list(range(n))
np_array = np.arange(n)

start = time.perf_counter()
squared_list = [x * x for x in py_list]           # Python loop, boxed ints
t_list = time.perf_counter() - start

start = time.perf_counter()
squared_array = np_array * np_array               # one vectorised C loop
t_array = time.perf_counter() - start

print(f"list: {t_list:.3f}s  numpy: {t_array:.4f}s")
print("memory per item:", 8, "bytes in numpy vs about", 28 + 8, "for a list of ints")
print(np.array([1, 2, 3]) + 10, [1, 2, 3] + [10])  # broadcasting vs list concatenation` },

  119: { code: C`
const course = {
  title: "SQL Basics",
  describe() { return "Course: " + this.title; },          // method call: this = course
  later() { return [1].map(() => this.title)[0]; },        // arrow: inherits this
};

console.log(course.describe());                    // Course: SQL Basics
const loose = course.describe;
try {
  console.log(loose());                            // plain call: this is undefined in strict mode
} catch (err) {
  console.log("lost this:", err.constructor.name);
}

const bound = course.describe.bind({ title: "Python" });   // explicit binding
console.log(bound(), course.describe.call({ title: "DSA" }));
console.log(course.later());

function Student(name) { this.name = name; }      // new: this = the new object
console.log(new Student("Asha").name);` },

  120: { code: C`
const animal = {
  speak() { return this.name + " makes a sound"; },
};

const dog = Object.create(animal);            // dog's prototype is animal
dog.name = "Bruno";
dog.fetch = function () { return this.name + " fetches"; };

console.log(dog.speak());                      // found on the prototype
console.log(Object.getPrototypeOf(dog) === animal, dog.hasOwnProperty("speak"));

class Vehicle {                                // class syntax uses the same mechanism
  constructor(wheels) { this.wheels = wheels; }
  describe() { return "wheels: " + this.wheels; }
}
class Bike extends Vehicle {
  constructor() { super(2); }
}
const bike = new Bike();
console.log(bike.describe());
console.log(Object.getPrototypeOf(Bike.prototype) === Vehicle.prototype);   // true` },

  121: { code: C`
function debounce(fn, wait) {                 // run once activity stops
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

function throttle(fn, interval) {             // run at most once per interval
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= interval) {
      last = now;
      fn(...args);
    }
  };
}

const search = debounce((q) => console.log("search API called with:", q), 100);
["s", "sq", "sql"].forEach((q, i) => setTimeout(() => search(q), i * 30));   // one call: "sql"

const onScroll = throttle((y) => console.log("scroll handled at", y), 100);
for (let i = 0; i < 10; i++) setTimeout(() => onScroll(i * 50), i * 25);      // a few calls only` },

  122: { code: C`
let notAssigned;
const profile = { name: "Asha", phone: null };    // null: deliberately empty

console.log(notAssigned, profile.email, profile.phone);   // undefined undefined null
console.log(typeof undefined, typeof null);              // "undefined" "object" (a historic bug)
console.log(null == undefined, null === undefined);      // true false

function greet(name = "guest") { return "Hi " + name; }
console.log(greet(undefined), greet(null));              // default applies only to undefined

console.log(profile.phone ?? "no phone", profile.phone || "falsy fallback");
console.log(profile.address?.city);                       // optional chaining: undefined, no crash
console.log(JSON.stringify({ a: undefined, b: null }));   // {"b":null}: undefined is dropped` },

  123: { code: C`
function Timer() {
  this.seconds = 0;
  setTimeout(function () {
    // regular function: its own this (not the Timer)
    console.log("regular function sees seconds:", this && this.seconds);
  }, 0);
  setTimeout(() => {
    this.seconds += 1;                       // arrow: uses the Timer's this
    console.log("arrow function sees seconds:", this.seconds);
  }, 0);
}
new Timer();

const square = (n) => n * n;                 // implicit return
const toObject = (id) => ({ id });           // wrap object literals in parentheses
console.log(square(9), toObject(7));

function showArgs() { return arguments.length; }
const arrowArgs = (...args) => args.length;  // arrows have no "arguments"; use rest
console.log(showArgs(1, 2, 3), arrowArgs(1, 2, 3));

const Arrow = () => {};
try { new Arrow(); } catch (err) { console.log("cannot use new:", err.constructor.name); }` },

  124: { code: C`
// A minimal HS256 JWT with Node's built-in crypto (use a library such as jsonwebtoken in production)
const crypto = require("crypto");
const b64url = (data) => Buffer.from(data).toString("base64url");
const SECRET = "change-me-in-env";

function sign(payload) {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify(payload));
  const signature = crypto.createHmac("sha256", SECRET).update(header + "." + body).digest("base64url");
  return [header, body, signature].join(".");
}

function verify(token) {
  const [header, body, signature] = token.split(".");
  const expected = crypto.createHmac("sha256", SECRET).update(header + "." + body).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error("bad signature");
  const payload = JSON.parse(Buffer.from(body, "base64url").toString());
  if (payload.exp < Date.now() / 1000) throw new Error("token expired");
  return payload;
}

const token = sign({ sub: "user-42", role: "student", exp: Math.floor(Date.now() / 1000) + 900 });
console.log(token.split(".").length, "parts:", verify(token).role);

const tampered = token.replace(/\.[^.]+\./, "." + b64url(JSON.stringify({ sub: "user-42", role: "admin", exp: 9999999999 })) + ".");
try { verify(tampered); } catch (err) { console.log("tampered token rejected:", err.message); }` },

  125: { code: C`
// XSS: never insert user input as HTML. Escape it (or use textContent).
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const comment = '<img src=x onerror="alert(document.cookie)">';
console.log("unsafe:", "<p>" + comment + "</p>");               // script would run
console.log("safe:  ", "<p>" + escapeHtml(comment) + "</p>");   // shown as plain text

// CSRF: cookies are sent automatically, so require a token the attacker cannot read
const crypto = require("crypto");
const sessionCsrfToken = crypto.randomBytes(16).toString("hex");
function handleTransfer(formToken) {
  return formToken === sessionCsrfToken ? "transfer accepted" : "rejected: CSRF token mismatch";
}
console.log(handleTransfer(sessionCsrfToken), "|", handleTransfer("forged"));
console.log("Set-Cookie: session=abc; HttpOnly; Secure; SameSite=Lax");` },

  127: { lang: 'jsx', code: C`
import { useRef, useState } from "react";

export function ControlledEmail() {
  const [email, setEmail] = useState("");            // React owns the value
  const valid = email.includes("@");
  return (
    <label>
      Email
      <input value={email} onChange={(e) => setEmail(e.target.value.trim())} />
      {!valid && email && <span> Enter a valid email</span>}
    </label>
  );
}

export function UncontrolledUpload() {
  const fileRef = useRef(null);                      // the DOM owns the value
  const submit = (e) => {
    e.preventDefault();
    alert("Selected: " + (fileRef.current.files[0]?.name || "nothing"));
  };
  return (
    <form onSubmit={submit}>
      <input type="file" ref={fileRef} />
      <button type="submit">Upload</button>
    </form>
  );
}` },

  128: { code: C`
from sklearn.datasets import load_digits
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

X, _ = load_digits(return_X_y=True)                  # 64 features per image
X_scaled = StandardScaler().fit_transform(X)         # scale first

pca = PCA(n_components=0.90).fit(X_scaled)           # keep 90% of the variance
print("components needed for 90% variance:", pca.n_components_, "of", X.shape[1])
print("first 3 explained ratios:", pca.explained_variance_ratio_[:3].round(3))

X_2d = PCA(n_components=2).fit_transform(X_scaled)   # 2D for plotting
print("reduced shape:", X_2d.shape)` },

  129: { code: C`
import numpy as np

def kmeans(X, k, iterations=50, seed=0):
    rng = np.random.default_rng(seed)
    centroids = X[rng.choice(len(X), k, replace=False)]           # 1. random start
    for _ in range(iterations):
        distances = np.linalg.norm(X[:, None] - centroids[None], axis=2)
        labels = distances.argmin(axis=1)                         # 2. assign to nearest
        new = np.array([X[labels == j].mean(axis=0) for j in range(k)])   # 3. move centroids
        if np.allclose(new, centroids):
            break                                                 # 4. converged
        centroids = new
    inertia = ((X - centroids[labels]) ** 2).sum()
    return labels, centroids, inertia

rng = np.random.default_rng(1)
customers = np.vstack([rng.normal([20, 30], 3, (50, 2)),          # young, low spend
                       rng.normal([45, 80], 4, (50, 2)),          # middle-aged, high spend
                       rng.normal([65, 40], 3, (50, 2))])         # older, medium spend
for k in (1, 2, 3, 4, 5):                                         # elbow method
    print(k, round(kmeans(customers, k)[2]))` },

  130: { code: C`
import numpy as np
from sklearn.linear_model import LinearRegression, LogisticRegression

hours = np.array([[1], [2], [3], [4], [5], [6], [7], [8]])
marks = np.array([35, 42, 50, 55, 63, 70, 74, 85])     # continuous target
passed = (marks >= 50).astype(int)                     # binary target

lin = LinearRegression().fit(hours, marks)
print(f"linear: marks = {lin.coef_[0]:.1f} * hours + {lin.intercept_:.1f}")
print("predicted marks for 9 hours:", lin.predict([[9]]).round(1))

log = LogisticRegression().fit(hours, passed)
print("probability of passing after 2.5 hours:", log.predict_proba([[2.5]])[0, 1].round(2))
print("predicted class for 2 and 6 hours:", log.predict([[2], [6]]))   # 0/1 via a sigmoid` },

  131: { code: C`
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

X, y = load_breast_cancer(return_X_y=True)
model = make_pipeline(StandardScaler(), SVC())             # scaler refit inside each fold
folds = StratifiedKFold(n_splits=5, shuffle=True, random_state=0)

scores = cross_val_score(model, X, y, cv=folds)
print("fold accuracies:", scores.round(3))
print(f"mean {scores.mean():.3f} +/- {scores.std():.3f}")` },

  132: { code: C`
from sklearn.datasets import make_classification
from sklearn.model_selection import cross_val_score
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import BaggingClassifier, GradientBoostingClassifier

X, y = make_classification(n_samples=800, n_features=20, n_informative=8, flip_y=0.05, random_state=3)

models = {
    "single deep tree": DecisionTreeClassifier(random_state=0),
    "bagging (parallel, cuts variance)": BaggingClassifier(DecisionTreeClassifier(), n_estimators=100, random_state=0),
    "boosting (sequential, cuts bias)": GradientBoostingClassifier(n_estimators=150, max_depth=2, random_state=0),
}
for name, model in models.items():
    print(f"{name:36} {cross_val_score(model, X, y, cv=5).mean():.3f}")` },

  133: { code: C`
from sklearn.datasets import make_classification
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import recall_score, precision_score
from sklearn.model_selection import train_test_split

X, y = make_classification(n_samples=5000, weights=[0.97, 0.03], random_state=7)   # 3% positives
X_tr, X_te, y_tr, y_te = train_test_split(X, y, stratify=y, random_state=7)

for weights in (None, "balanced"):
    model = LogisticRegression(class_weight=weights, max_iter=1000).fit(X_tr, y_tr)
    pred = model.predict(X_te)
    print(f"class_weight={weights!s:9} accuracy={model.score(X_te, y_te):.3f} "
          f"recall={recall_score(y_te, pred):.2f} precision={precision_score(y_te, pred):.2f}")

probs = LogisticRegression(max_iter=1000).fit(X_tr, y_tr).predict_proba(X_te)[:, 1]
print("recall with threshold 0.2:", round(recall_score(y_te, probs >= 0.2), 2))   # threshold tuning` },

  135: { code: C`
from collections import OrderedDict
import time

class LRUCache:
    def __init__(self, capacity):
        self.capacity, self.data = capacity, OrderedDict()
        self.hits = self.misses = 0

    def get(self, key, load):
        if key in self.data:
            self.hits += 1
            self.data.move_to_end(key)              # mark as recently used
            return self.data[key]
        self.misses += 1
        value = load(key)                           # cache-aside: load on a miss
        self.data[key] = value
        if len(self.data) > self.capacity:
            self.data.popitem(last=False)           # evict least recently used
        return value

def slow_db_lookup(user_id):
    time.sleep(0.01)                                # pretend database latency
    return {"id": user_id, "name": f"user{user_id}"}

cache = LRUCache(capacity=3)
for uid in [1, 2, 1, 3, 1, 4, 2, 1]:
    cache.get(uid, slow_db_lookup)
print("hits:", cache.hits, "misses:", cache.misses, "cached keys:", list(cache.data))` },

  138: { lang: 'shell', code: C`
# Merge: keeps both histories and adds a merge commit
git switch main
git merge feature/login          # creates "Merge branch 'feature/login'"

# Rebase: replays your commits on top of the latest main (linear history)
git switch feature/login
git fetch origin
git rebase origin/main           # fix conflicts, then: git rebase --continue
git push --force-with-lease      # only on YOUR branch, never on a shared one

# Squash a messy branch into one commit when merging
git switch main
git merge --squash feature/login
git commit -m "Add login with OTP"` },

  139: { lang: 'dockerfile', code: C`
# Dockerfile for a small Node.js API
FROM node:20-alpine              # shares the host kernel, so it starts in seconds
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev            # cached layer: reinstalls only when dependencies change

COPY . .
ENV NODE_ENV=production
EXPOSE 5000
USER node                        # do not run as root
CMD ["node", "server/index.js"]

# Build and run:
#   docker build -t codelekho-api .
#   docker run -p 5000:5000 --env-file .env codelekho-api` },

  140: { lang: 'yaml', code: C`
# .github/workflows/ci.yml: test every push, deploy main
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npx vitest run          # continuous integration
      - run: npx vite build

  deploy:
    needs: test                      # only if tests pass
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "deploying build to production"   # continuous delivery step` },

  141: { code: C`
import queue
import threading
import time

orders = queue.Queue()                       # stands in for RabbitMQ, SQS or Kafka

def checkout_service():
    for order_id in range(1, 6):
        orders.put({"order_id": order_id})   # publish and return to the user at once
        print(f"order {order_id} placed (user does not wait for the email)")
    orders.put(None)                         # sentinel: no more work

def email_worker():
    while (message := orders.get()) is not None:
        time.sleep(0.02)                     # slow work happens in the background
        print(f"  email sent for order {message['order_id']}")
        orders.task_done()

worker = threading.Thread(target=email_worker)
worker.start()
checkout_service()
worker.join()` },

  142: { code: C`
import hashlib
import string

ALPHABET = string.digits + string.ascii_lowercase + string.ascii_uppercase   # Base62

def encode_base62(num):
    if num == 0:
        return ALPHABET[0]
    chars = []
    while num:
        num, rem = divmod(num, 62)
        chars.append(ALPHABET[rem])
    return "".join(reversed(chars))

class UrlShortener:
    def __init__(self):
        self.next_id = 125_000_000           # a counter (in real life from a DB sequence)
        self.code_to_url, self.url_to_code = {}, {}

    def shorten(self, url):
        if url in self.url_to_code:          # same URL, same code
            return self.url_to_code[url]
        code = encode_base62(self.next_id)
        self.next_id += 1
        self.code_to_url[code], self.url_to_code[url] = url, code
        return code

    def resolve(self, code):                 # would answer HTTP 301/302
        return self.code_to_url.get(code)

s = UrlShortener()
code = s.shorten("https://example.com/interview-prep/sql-50?utm_source=whatsapp")
print(code, "->", s.resolve(code))
print("7 Base62 characters give", f"{62 ** 7:,}", "codes")` },

  143: { code: C`
import unittest
from unittest.mock import Mock

def apply_discount(price, percent):              # unit under test
    if not 0 <= percent <= 100:
        raise ValueError("percent must be 0-100")
    return round(price * (100 - percent) / 100, 2)

def checkout(cart, payment_gateway):             # depends on an external service
    total = sum(apply_discount(p, d) for p, d in cart)
    return payment_gateway.charge(total)

class UnitTests(unittest.TestCase):
    def test_discount(self):
        self.assertEqual(apply_discount(500, 10), 450.0)

    def test_invalid_percent(self):
        with self.assertRaises(ValueError):
            apply_discount(500, 120)

class IntegrationStyleTest(unittest.TestCase):
    def test_checkout_charges_total(self):
        gateway = Mock()                         # fake the external payment API
        gateway.charge.return_value = "ok"
        self.assertEqual(checkout([(500, 10), (200, 0)], gateway), "ok")
        gateway.charge.assert_called_once_with(650.0)

unittest.main(argv=["tests"], exit=False, verbosity=2)` },
};
