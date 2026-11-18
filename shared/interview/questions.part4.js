// Interview Questions, questions 151-177: more OOP, DSA concepts and Operating Systems.
// Same answer format as questions60.js; every snippet is unique and runs as written.

const Q = (n, topic, difficulty, title, answer, code, lang) => ({
  id: `iq-${n}`, n, topic, difficulty, title,
  answer: Array.isArray(answer) ? answer.join('\n\n') : answer,
  ...(code ? { code: code.replace(/^\n/, '') } : {}), ...(lang ? { lang } : {})
});
const L = (...items) => items.map(x => `- ${x}`).join('\n');
const N = (...items) => items.map((x, i) => `${i + 1}. ${x}`).join('\n');
const C = String.raw;

export const QUESTIONS_PART4 = [
  // ---------------- OOP ----------------
  Q(151, 'OOP', 'Easy', 'Abstraction vs encapsulation: what is the difference?', [
    "The two are often confused because both hide something. The difference is **what** they hide and **why**.",
    L("**Abstraction** hides **complexity**. It is a design-level idea: decide what an object should expose (its essential behaviour) and leave out how it works. A `PaymentGateway` exposes `pay(amount)`; callers do not care whether it talks to UPI, a card network or a wallet. Achieved with abstract classes, interfaces and clear method names.",
      "**Encapsulation** hides **data** and protects it. It is an implementation-level idea: bundle the state with the methods that change it and block direct access, so the object can never be put into an invalid state. Achieved with access modifiers (`private` in Java) or naming conventions and properties in Python."),
    "A useful one-liner: abstraction is about the **outside view** (what can I do with it?), encapsulation is about the **inside** (who is allowed to touch the data?).",
    "They work together. In the example below, the abstract class defines **what** every notifier does (abstraction), and each class keeps its own connection details private (encapsulation).",
    "Interview tip: use a car. Abstraction is the steering wheel and pedals; encapsulation is the locked bonnet that stops you changing the engine timing while driving."
  ], C`
from abc import ABC, abstractmethod

class Notifier(ABC):                       # abstraction: WHAT a notifier does
    @abstractmethod
    def send(self, to, message): ...

class SmsNotifier(Notifier):
    def __init__(self, api_key):
        self.__api_key = api_key           # encapsulation: hidden detail
        self._sent = 0

    def send(self, to, message):
        self._sent += 1
        return f"SMS to {to}: {message} (#{self._sent})"

class EmailNotifier(Notifier):
    def send(self, to, message):
        return f"Email to {to}: {message}"

for n in (SmsNotifier("key-123"), EmailNotifier()):
    print(n.send("Asha", "Your interview is at 10 AM"))

# Notifier()  -> TypeError: can't instantiate abstract class`),

  Q(152, 'OOP', 'Hard', 'What is the diamond problem and how does Python solve it?', [
    "The **diamond problem** appears with multiple inheritance. Class `D` inherits from `B` and `C`, and both inherit from `A`. If `B` and `C` both override a method of `A`, which version should `D` use, and should `A`'s set-up run once or twice?",
    "Languages handle it differently:",
    L("**Java** avoids it for classes by allowing only single class inheritance. A class may implement many interfaces; if two interfaces give the same default method, the class must override it explicitly.",
      "**C++** allows it and uses **virtual inheritance** so that only one shared copy of `A` exists.",
      "**Python** allows it and resolves it with the **Method Resolution Order (MRO)**, computed by the **C3 linearisation** algorithm."),
    "The MRO is a single ordered list of classes that Python searches for attributes. It guarantees that a child always comes before its parents and that the order of parents in the class statement is respected. For `class D(B, C)` the MRO is `D, B, C, A, object`. You can see it with `D.__mro__` or `D.mro()`.",
    "`super()` follows the MRO, not simply \"the parent\". When every class calls `super().__init__()`, each `__init__` in the diamond runs **exactly once**. This is called **cooperative multiple inheritance**.",
    "Interview tip: print the MRO in your answer and show that `A` is initialised only once. It proves you know what super() really does."
  ], C`
class A:
    def __init__(self):
        print("A init")
    def hello(self):
        return "A"

class B(A):
    def __init__(self):
        print("B init")
        super().__init__()
    def hello(self):
        return "B"

class C(A):
    def __init__(self):
        print("C init")
        super().__init__()
    def hello(self):
        return "C"

class D(B, C):
    def __init__(self):
        print("D init")
        super().__init__()

d = D()                               # D, B, C, A: each runs once
print([k.__name__ for k in D.__mro__])  # ['D', 'B', 'C', 'A', 'object']
print(d.hello())                      # 'B': first match in the MRO`),

  Q(153, 'OOP', 'Easy', 'What are access modifiers: public, private, protected and default?', [
    "Access modifiers control **which code can see a class member**. They are the main tool for encapsulation in Java and C++.",
    "In Java there are four levels:",
    L("**public**: visible everywhere.",
      "**protected**: visible in the same package and in subclasses, even in other packages.",
      "**default** (no keyword, also called package-private): visible only inside the same package.",
      "**private**: visible only inside the same class. This is the usual choice for fields."),
    "A typical class keeps fields `private` and exposes `public` methods (getters, setters with validation, or better, meaningful actions like `withdraw()`).",
    "Python has **no enforced access control**; it relies on conventions:",
    L("`name`: public.",
      "`_name`: \"internal, please do not use from outside\". Still accessible.",
      "`__name`: triggers **name mangling** to `_ClassName__name`, which avoids accidental clashes in subclasses. It is not real security either."),
    "The Python saying is \"we are all consenting adults here\": the code tells you what is private, and you respect it.",
    "Interview tip: mention that `private` protects against mistakes, not attackers. Reflection in Java and name mangling in Python can both get around it."
  ], C`
// Save as Main.java and run: java Main.java
public class Main {
    static class BankAccount {
        private double balance;            // only this class can touch it
        protected String branch = "Pune";  // package + subclasses
        String ifsc = "CLK0001";           // default: same package only
        public final String owner;         // everyone may read it

        public BankAccount(String owner) { this.owner = owner; }

        public void deposit(double amount) {
            if (amount <= 0) throw new IllegalArgumentException("Amount must be positive");
            balance += amount;
        }
        public double getBalance() { return balance; }
    }

    public static void main(String[] args) {
        BankAccount acc = new BankAccount("Asha");
        acc.deposit(2500);
        // acc.balance = -100;             // compile error: balance has private access
        System.out.println(acc.owner + " has " + acc.getBalance() + " at " + acc.branch);
    }
}`, 'java'),

  Q(154, 'OOP', 'Medium', 'What does super() do, and when should you use it?', [
    "`super()` gives you access to methods of the **next class in the method resolution order**, which in single inheritance simply means the parent class. It is used to **extend** inherited behaviour instead of replacing it entirely.",
    "Common uses:",
    L("**Calling the parent constructor**: a `Manager.__init__` calls `super().__init__(name, salary)` so the parent sets up its own attributes, then adds `self.reports = []`. Forgetting this leaves the object half-initialised.",
      "**Extending a method**: an overriding method does extra work and then calls `super().method()` to keep the original behaviour (for example, add validation before saving).",
      "**Cooperative multiple inheritance**: in a diamond, `super()` moves along the MRO so every class's method runs once."),
    "Why `super()` rather than `Parent.__init__(self, ...)`? Naming the parent directly hard-codes the class, breaks if the hierarchy changes, and can run a shared base twice in multiple inheritance.",
    "In Java, `super(...)` must be the **first statement** in a constructor, and `super.method()` calls the parent's version of an overridden method.",
    "Interview tip: show a constructor that calls super() and then adds its own field. That is exactly the situation interviewers expect you to describe."
  ], C`
class Employee:
    def __init__(self, name, salary):
        self.name = name
        self.salary = salary

    def annual_pay(self):
        return self.salary * 12

class Manager(Employee):
    def __init__(self, name, salary, team_size):
        super().__init__(name, salary)      # let the parent set up its part
        self.team_size = team_size          # then add what is new

    def annual_pay(self):
        base = super().annual_pay()         # extend, do not rewrite
        return base + 5000 * self.team_size

m = Manager("Priya", 100000, team_size=4)
print(m.name, m.annual_pay())               # Priya 1220000`),

  Q(155, 'OOP', 'Hard', 'Why must __eq__ and __hash__ agree?', [
    "Python dictionaries and sets find items by **hash first, equality second**: they use `hash(key)` to pick a bucket and then `==` to confirm the match. That only works if one rule holds: **objects that are equal must have the same hash**. (Unequal objects may share a hash; that is just a collision.)",
    "What goes wrong when the rule is broken:",
    L("If you define `__eq__` to compare by value but keep the default identity-based hash, two \"equal\" objects land in different buckets. A set then keeps both duplicates, and `obj in my_set` can return `False` for an equal object.",
      "If the fields used in the hash **change** after the object is placed in a set or used as a dict key, the object is now in the wrong bucket and effectively lost."),
    "Python protects you partly: if a class defines `__eq__` without `__hash__`, its `__hash__` is set to `None`, so instances become **unhashable** and cannot go into sets at all.",
    "The correct pattern:",
    L("Hash only the fields that `__eq__` compares, usually as `hash((self.a, self.b))`.",
      "Make those fields immutable. A `@dataclass(frozen=True)` generates matching `__eq__` and `__hash__` for you."),
    "The same contract exists in Java: overriding `equals()` requires overriding `hashCode()`, or `HashMap` and `HashSet` misbehave.",
    "Interview tip: state the rule in one sentence, \"equal objects must have equal hashes\", then show the frozen dataclass. Short and complete."
  ], C`
from dataclasses import dataclass

class PointBad:
    def __init__(self, x, y):
        self.x, self.y = x, y
    def __eq__(self, other):
        return (self.x, self.y) == (other.x, other.y)
    # no __hash__: Python sets __hash__ = None

try:
    {PointBad(1, 2)}
except TypeError as err:
    print("PointBad:", err)                 # unhashable type

@dataclass(frozen=True)                     # immutable, eq and hash generated together
class Point:
    x: int
    y: int

visited = {Point(1, 2), Point(1, 2), Point(3, 4)}
print(len(visited), Point(1, 2) in visited)   # 2 True`),

  Q(156, 'OOP', 'Medium', 'What is the Singleton pattern, and what are its problems?', [
    "A **Singleton** ensures a class has **only one instance** and gives a global access point to it. Typical candidates are a configuration object, a logger, a connection pool or a hardware driver, where two copies would waste resources or conflict.",
    "Ways to implement it:",
    L("**Java**: a private constructor plus a static `getInstance()`. The simplest thread-safe version is an `enum` with one value, or the holder-class idiom. Lazy creation with double-checked locking needs a `volatile` field.",
      "**Python**: overriding `__new__` to return a stored instance, a decorator, or most simply a **module-level object**: modules are imported once, so a module is already a singleton."),
    "The problems interviewers want you to know:",
    L("It is **global state in disguise**, so hidden dependencies make code hard to reason about.",
      "**Testing is painful**: tests share the same instance and leak state into each other, and it is hard to substitute a fake.",
      "It breaks the **single responsibility principle**, because the class manages both its job and its own lifetime.",
      "**Concurrency**: lazy creation must be thread-safe, or two threads may each create an instance."),
    "Modern code usually prefers to create one instance at start-up and **pass it in** (dependency injection), which gives \"only one\" without the global access.",
    "Interview tip: implement it, then say when you would avoid it. Knowing the downsides is what separates a good answer."
  ], C`
import threading

class AppConfig:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:                       # thread-safe lazy creation
                if cls._instance is None:         # double-checked
                    cls._instance = super().__new__(cls)
                    cls._instance.settings = {"env": "prod", "retries": 3}
        return cls._instance

a = AppConfig()
b = AppConfig()
a.settings["retries"] = 5
print(a is b, b.settings["retries"])     # True 5: one shared instance`),

  Q(157, 'OOP', 'Medium', 'What are magic (dunder) methods and operator overloading?', [
    "**Magic methods** (dunder methods, from \"double underscore\") are special methods such as `__init__`, `__str__` and `__add__` that Python calls automatically when you use built-in syntax. Defining them lets your own objects behave like built-in types. Using them to give operators a meaning for your class is called **operator overloading**.",
    "The most useful groups:",
    L("**Representation**: `__str__` (readable, used by `print`) and `__repr__` (unambiguous, used in the console and in logs).",
      "**Comparison**: `__eq__`, `__lt__`, `__le__` and so on; `functools.total_ordering` fills in the rest from `__eq__` and one other.",
      "**Arithmetic**: `__add__`, `__sub__`, `__mul__`, plus `__radd__` for `2 + obj` and `__iadd__` for `+=`.",
      "**Containers**: `__len__`, `__getitem__`, `__contains__`, `__iter__`, so `len(obj)`, `obj[i]`, `x in obj` and `for x in obj` all work.",
      "**Others**: `__call__` (call an object like a function), `__enter__`/`__exit__` (the `with` statement), `__bool__`, `__hash__`."),
    "Good practice: return `NotImplemented` (not an error) when the other operand is an unsupported type, so Python can try the other object's method; and keep operators unsurprising: `+` should feel like addition.",
    "Java has no operator overloading for user classes; C++ and Python do.",
    "Interview tip: build a small `Vector` or `Money` class live. It covers repr, arithmetic and equality in a few lines."
  ], C`
class Vector:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __repr__(self):
        return f"Vector({self.x}, {self.y})"

    def __add__(self, other):
        if not isinstance(other, Vector):
            return NotImplemented
        return Vector(self.x + other.x, self.y + other.y)

    def __mul__(self, k):                  # vector * number
        return Vector(self.x * k, self.y * k)

    __rmul__ = __mul__                     # number * vector

    def __eq__(self, other):
        return isinstance(other, Vector) and (self.x, self.y) == (other.x, other.y)

    def __abs__(self):
        return (self.x ** 2 + self.y ** 2) ** 0.5

v = Vector(3, 4)
print(v + Vector(1, 1), 2 * v, abs(v), v == Vector(3, 4))
# Vector(4, 5) Vector(6, 8) 5.0 True`),

  Q(158, 'OOP', 'Medium', 'What is dependency injection?', [
    "**Dependency injection (DI)** means an object **receives** the things it depends on from outside, instead of creating them itself. A `CheckoutService` that needs a payment gateway gets one passed into its constructor rather than calling `RazorpayGateway()` inside.",
    "Why it matters:",
    L("**Testability**: in tests you inject a fake gateway that records calls, so no real money moves and tests are fast.",
      "**Loose coupling**: the service depends on an abstraction (\"something with a `charge()` method\"), so you can switch providers without editing it. This is the **D** in SOLID, the dependency inversion principle.",
      "**Configuration in one place**: the application wires real objects together at start-up (the **composition root**)."),
    "Forms of injection: **constructor injection** (most common and clearest, since dependencies are required up front), **setter injection** (optional dependencies) and **method injection** (passed per call).",
    "Frameworks automate the wiring: Spring in Java, ASP.NET Core in C#, Angular in TypeScript, and FastAPI's `Depends` in Python. In Python, plain constructor arguments are often enough.",
    "Interview tip: show the test with a fake dependency. The test is the reason DI exists, so it makes the idea click."
  ], C`
class RazorpayGateway:
    def charge(self, amount):
        raise RuntimeError("would call the real payment API")

class FakeGateway:                          # used in tests
    def __init__(self):
        self.charged = []
    def charge(self, amount):
        self.charged.append(amount)
        return "ok"

class CheckoutService:
    def __init__(self, gateway):            # dependency is injected
        self.gateway = gateway

    def checkout(self, cart):
        total = sum(price * qty for price, qty in cart)
        return self.gateway.charge(total)

fake = FakeGateway()
service = CheckoutService(fake)
print(service.checkout([(499, 2), (149, 1)]), fake.charged)   # ok [1147]`),

  Q(159, 'OOP', 'Medium', 'Association vs aggregation vs composition?', [
    "All three describe how objects of different classes are related. They differ in **how strongly** the objects are tied together and **who controls the lifetime**.",
    L("**Association**: a general \"uses\" or \"knows about\" relationship between independent objects. A `Teacher` teaches `Student`s; either can exist without the other, and neither owns the other.",
      "**Aggregation**: a \"has-a\" relationship where the part **can live on its own**. A `Department` has `Professor`s, but if the department closes, the professors still exist and can join another. Weak ownership; drawn in UML with a hollow diamond.",
      "**Composition**: a strong \"owns-a\" relationship where the part **cannot exist without the whole**. A `House` is made of `Room`s; destroy the house and the rooms are gone. The whole usually creates the parts itself. Drawn in UML with a filled diamond."),
    "In code the difference shows in **who creates the part**: with aggregation the part is created elsewhere and passed in; with composition the owner creates it inside its constructor and nobody else holds a reference.",
    "Composition is what the advice \"favour composition over inheritance\" refers to: build behaviour by combining owned parts instead of extending base classes.",
    "Interview tip: give the department/professor and house/room pair together. Interviewers mainly check that you know which side owns the lifetime."
  ], C`
class Professor:
    def __init__(self, name):
        self.name = name

class Department:                           # aggregation: professors exist independently
    def __init__(self, name, professors):
        self.name = name
        self.professors = professors        # passed in, created elsewhere

class Room:
    def __init__(self, kind):
        self.kind = kind

class House:                                # composition: rooms are owned
    def __init__(self):
        self.rooms = [Room("kitchen"), Room("bedroom")]   # created inside

rao = Professor("Dr. Rao")
cse = Department("CSE", [rao])
del cse                                     # department gone...
print(rao.name, "still exists")             # ...the professor is not

home = House()
print([r.kind for r in home.rooms])         # rooms live and die with the house`),

  // ---------------- DSA Concepts ----------------
  Q(160, 'DSA Concepts', 'Easy', 'What is a graph, and how do you represent one?', [
    "A **graph** is a set of **vertices** (nodes) connected by **edges**. It models anything with relationships: road maps, social networks, course prerequisites, web links and computer networks.",
    "Kinds of graphs: **directed** (edges have a direction, like Twitter follows) or **undirected** (friendship); **weighted** (edges carry a cost, like distances) or unweighted; **cyclic** or **acyclic** (a DAG, such as task dependencies); **connected** or not.",
    "The two standard representations:",
    L("**Adjacency list**: for each vertex, a list of its neighbours (a dict of lists in Python). Space O(V + E). Iterating a vertex's neighbours is fast. This is the default for most problems, because real graphs are usually **sparse** (few edges per node).",
      "**Adjacency matrix**: a V by V grid where `matrix[u][v]` is 1 (or the weight) if an edge exists. Space O(V squared), but checking whether an edge exists is O(1). Good for **dense** graphs or small V, as in Floyd-Warshall."),
    "A third form, an **edge list** (a list of `(u, v, weight)` triples), is used by Kruskal's algorithm and for input parsing.",
    "Interview tip: always ask whether the graph is directed and weighted, then say \"I'll use an adjacency list, since it is sparse\". It shows you choose the structure deliberately."
  ], C`
from collections import defaultdict

edges = [("Pune", "Mumbai", 150), ("Pune", "Goa", 450), ("Mumbai", "Goa", 590), ("Goa", "Hubli", 160)]

# Adjacency list (undirected, weighted)
graph = defaultdict(list)
for u, v, w in edges:
    graph[u].append((v, w))
    graph[v].append((u, w))
print(dict(graph)["Goa"])

# Adjacency matrix for the same graph
cities = sorted(graph)
index = {c: i for i, c in enumerate(cities)}
matrix = [[0] * len(cities) for _ in cities]
for u, v, w in edges:
    matrix[index[u]][index[v]] = matrix[index[v]][index[u]] = w
print(cities)
for row in matrix:
    print(row)`),

  Q(161, 'DSA Concepts', 'Medium', 'Merge sort vs quicksort: how do they work and which is better?', [
    "Both are **divide-and-conquer** sorts with O(n log n) average time, but they split the work differently.",
    "**Merge sort** splits the array into two halves, sorts each half recursively, then **merges** the two sorted halves by repeatedly taking the smaller front element.",
    L("Time: O(n log n) in **every** case (log n levels, O(n) merging per level).",
      "Space: O(n) extra for merging.",
      "**Stable**: equal elements keep their original order.",
      "Excellent for linked lists and for external sorting of data too big for memory."),
    "**Quicksort** picks a **pivot**, **partitions** the array so smaller elements go left and larger go right, then sorts each side recursively.",
    L("Time: O(n log n) on average, but **O(n squared) in the worst case**, when the pivot is always the smallest or largest element (for example a sorted array with the first element as pivot). A random pivot or median-of-three makes this very unlikely.",
      "Space: O(log n) for the recursion stack; it sorts **in place**.",
      "**Not stable**.",
      "Usually the fastest in practice because of cache-friendly sequential access and small constant factors."),
    "Real libraries use hybrids: Python's `sorted()` and Java's object sort use **Timsort** (merge sort plus insertion sort, stable and very fast on partly sorted data); C++ `std::sort` uses **introsort** (quicksort that switches to heapsort if recursion gets too deep).",
    "Interview tip: mention stability and the quicksort worst case without being asked. Those are the two follow-ups that always come."
  ], C`
import random

def merge_sort(a):
    if len(a) <= 1:
        return a
    mid = len(a) // 2
    left, right = merge_sort(a[:mid]), merge_sort(a[mid:])
    merged, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:            # <= keeps it stable
            merged.append(left[i]); i += 1
        else:
            merged.append(right[j]); j += 1
    return merged + left[i:] + right[j:]

def quick_sort(a, lo=0, hi=None):
    if hi is None:
        hi = len(a) - 1
    if lo >= hi:
        return a
    p = random.randint(lo, hi)              # random pivot avoids the O(n^2) case
    a[p], a[hi] = a[hi], a[p]
    pivot, store = a[hi], lo
    for i in range(lo, hi):                 # Lomuto partition
        if a[i] < pivot:
            a[i], a[store] = a[store], a[i]
            store += 1
    a[store], a[hi] = a[hi], a[store]
    quick_sort(a, lo, store - 1)
    quick_sort(a, store + 1, hi)
    return a

data = [38, 27, 43, 3, 9, 82, 10, 27]
print(merge_sort(data))
print(quick_sort(data[:]))`),

  Q(162, 'DSA Concepts', 'Hard', 'What is a balanced binary search tree, and why does it matter?', [
    "A binary search tree (BST) gives O(h) search, insert and delete, where h is the tree's **height**. If the tree stays bushy, h is about log n. But inserting already-sorted data into a plain BST makes every node a right child, so the tree becomes a **linked list** with h = n, and every operation degrades to O(n).",
    "A **self-balancing BST** restructures itself after inserts and deletes, using **rotations**, so the height always stays O(log n). The common ones:",
    L("**AVL tree**: for every node, the heights of the left and right subtrees differ by at most 1. Very strictly balanced, so lookups are fast; inserts and deletes may need more rotations.",
      "**Red-black tree**: nodes are coloured red or black under rules that guarantee the longest path is at most twice the shortest. Looser balance, fewer rotations, so writes are faster. Used by Java's `TreeMap`, C++ `std::map` and the Linux scheduler.",
      "**B-trees and B+ trees**: balanced trees with many keys per node, designed for disks. Almost every database index uses a B+ tree."),
    "Why not always use a hash table? A balanced BST keeps keys **in sorted order**, so it supports range queries (\"all keys between 10 and 20\"), floor and ceiling, and in-order iteration, which hashing cannot do.",
    "Interview tip: show the height of a BST built from sorted input. Then say \"that is why we need balancing\". Python has no built-in balanced BST; the `sortedcontainers` library or `bisect` on a list are the usual substitutes."
  ], C`
import random

class Node:
    __slots__ = ("key", "left", "right")
    def __init__(self, key):
        self.key, self.left, self.right = key, None, None

def insert(root, key):                      # plain, unbalanced BST insert
    if root is None:
        return Node(key)
    node = root
    while True:
        side = "left" if key < node.key else "right"
        child = getattr(node, side)
        if child is None:
            setattr(node, side, Node(key))
            return root
        node = child

def height(node):
    if node is None:
        return 0
    stack, best = [(node, 1)], 0
    while stack:
        n, h = stack.pop()
        best = max(best, h)
        for c in (n.left, n.right):
            if c:
                stack.append((c, h + 1))
    return best

keys = list(range(1, 1001))
sorted_root = None
for k in keys:
    sorted_root = insert(sorted_root, k)
random.seed(1)
random.shuffle(keys)
random_root = None
for k in keys:
    random_root = insert(random_root, k)
print("height from sorted input:", height(sorted_root))    # 1000: a linked list
print("height from shuffled input:", height(random_root))  # about 20
print("balanced tree would be:", (1000).bit_length())      # 10`),

  Q(163, 'DSA Concepts', 'Hard', "How does Dijkstra's algorithm work?", [
    "**Dijkstra's algorithm** finds the **shortest path from one source to every other vertex** in a graph whose edge weights are **non-negative**, such as road distances or network latencies.",
    "The idea is greedy: always settle the unvisited vertex with the **smallest known distance**, because with non-negative weights no later path can make it shorter.",
    N("Set the distance to the source as 0 and every other distance as infinity.",
      "Put `(0, source)` into a **min-heap** (priority queue).",
      "Pop the vertex with the smallest distance. If that entry is outdated (a shorter distance was already found), skip it.",
      "For each neighbour, **relax** the edge: if `dist[u] + weight < dist[v]`, update `dist[v]`, remember `u` as its previous vertex, and push the new distance.",
      "Repeat until the heap is empty. Follow the previous-vertex links backwards to rebuild any path."),
    "Complexity with a binary heap: **O((V + E) log V)**. With a plain array instead of a heap it is O(V squared), which is fine for dense graphs.",
    "Limits and alternatives:",
    L("**Negative edge weights** break it. Use **Bellman-Ford** (O(VE)), which also detects negative cycles.",
      "**Unweighted** graphs need only BFS.",
      "**All pairs** of shortest paths: Floyd-Warshall, O(V cubed).",
      "**A-star search** adds a heuristic (such as straight-line distance) to reach one target faster; it is what map apps build on."),
    "Interview tip: mention the \"skip stale heap entries\" check. It is the detail that makes the heap version correct without a decrease-key operation."
  ], C`
import heapq

def dijkstra(graph, source):
    dist = {v: float("inf") for v in graph}
    prev = {}
    dist[source] = 0
    heap = [(0, source)]
    while heap:
        d, u = heapq.heappop(heap)
        if d > dist[u]:
            continue                          # stale entry, already improved
        for v, w in graph[u]:
            if d + w < dist[v]:               # relax the edge
                dist[v], prev[v] = d + w, u
                heapq.heappush(heap, (dist[v], v))
    return dist, prev

def path_to(prev, target):
    path = [target]
    while path[-1] in prev:
        path.append(prev[path[-1]])
    return path[::-1]

roads = {
    "A": [("B", 4), ("C", 1)],
    "B": [("D", 1)],
    "C": [("B", 2), ("D", 5)],
    "D": [],
}
dist, prev = dijkstra(roads, "A")
print(dist)                    # {'A': 0, 'B': 3, 'C': 1, 'D': 4}
print(path_to(prev, "D"))      # ['A', 'C', 'B', 'D']`),

  Q(164, 'DSA Concepts', 'Medium', 'What is topological sorting?', [
    "A **topological sort** orders the vertices of a **directed acyclic graph (DAG)** so that for every edge `u -> v`, `u` comes before `v`. Think of it as \"an order in which you can do tasks so that every prerequisite comes first\".",
    "Where it is used: course schedules, build systems (compile dependencies first), package managers installing dependencies, spreadsheet formula evaluation and task scheduling.",
    "Two standard algorithms, both O(V + E):",
    L("**Kahn's algorithm (BFS)**: compute every vertex's **in-degree** (number of incoming edges). Put all vertices with in-degree 0 in a queue. Repeatedly remove one, add it to the order, and decrease the in-degree of its neighbours, queuing any that reach 0. If the final order has fewer than V vertices, the graph has a **cycle**, so no valid order exists.",
      "**DFS-based**: run DFS and add each vertex to a list **after** all its descendants are finished (post-order), then reverse the list. Cycle detection uses three colours: unvisited, in progress, done. Reaching an in-progress vertex means a cycle."),
    "A DAG can have **many** valid topological orders; any one is acceptable unless the problem asks for a specific one (for example the lexicographically smallest, which uses a min-heap instead of a queue).",
    "Interview tip: the classic question is \"Course Schedule: can all courses be finished?\" Answer: run Kahn's algorithm and check whether every course got processed."
  ], C`
from collections import deque, defaultdict

def course_order(num_courses, prerequisites):
    graph = defaultdict(list)
    indegree = [0] * num_courses
    for course, needs in prerequisites:     # 'needs' must be done before 'course'
        graph[needs].append(course)
        indegree[course] += 1

    queue = deque(c for c in range(num_courses) if indegree[c] == 0)
    order = []
    while queue:
        c = queue.popleft()
        order.append(c)
        for nxt in graph[c]:
            indegree[nxt] -= 1
            if indegree[nxt] == 0:
                queue.append(nxt)
    return order if len(order) == num_courses else None   # None means a cycle

print(course_order(4, [(1, 0), (2, 0), (3, 1), (3, 2)]))  # [0, 1, 2, 3]
print(course_order(2, [(0, 1), (1, 0)]))                  # None: cycle`),

  Q(165, 'DSA Concepts', 'Medium', 'Memoization vs tabulation in dynamic programming?', [
    "Both are ways to implement dynamic programming, which solves a problem by combining answers to **overlapping subproblems** and storing each answer so it is computed only once.",
    L("**Memoization (top-down)**: write the natural recursive solution, then cache results in a dictionary (or `@functools.lru_cache`). The recursion starts from the full problem and only visits the subproblems it actually needs.",
      "**Tabulation (bottom-up)**: fill a table iteratively, starting from the smallest subproblems (the base cases) and building up to the answer. No recursion at all."),
    "How they compare:",
    L("**Ease of writing**: memoization is usually easier, because you only add a cache to the recursive formula.",
      "**Recursion limits**: deep memoized recursion can hit Python's recursion limit (about 1000 by default); tabulation never does.",
      "**Work done**: memoization skips states that are never needed; tabulation computes every state, but with less overhead per state.",
      "**Space optimisation**: tabulation makes it easy to keep only the last row or two, often reducing memory from O(n times m) to O(m)."),
    "A good process in interviews: define the state, write the recurrence, implement it with memoization, then convert to tabulation and optimise space if asked.",
    "Interview tip: solve one problem both ways, as below. The grid-paths problem is small enough to write both versions in two minutes."
  ], C`
from functools import lru_cache

# Number of paths from top-left to bottom-right of an r x c grid,
# moving only right or down, avoiding blocked cells (1).
grid = [
    [0, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 0, 1],
    [1, 0, 0, 0],
]
R, C = len(grid), len(grid[0])

@lru_cache(maxsize=None)
def paths_memo(r, c):                          # top-down
    if r >= R or c >= C or grid[r][c] == 1:
        return 0
    if (r, c) == (R - 1, C - 1):
        return 1
    return paths_memo(r + 1, c) + paths_memo(r, c + 1)

def paths_table():                             # bottom-up, one row of memory
    row = [0] * (C + 1)
    for r in range(R - 1, -1, -1):
        for c in range(C - 1, -1, -1):
            if grid[r][c] == 1:
                row[c] = 0
            elif (r, c) == (R - 1, C - 1):
                row[c] = 1
            else:
                row[c] = row[c] + row[c + 1]   # below + right
    return row[0]

print(paths_memo(0, 0), paths_table())         # same answer both ways`),

  Q(166, 'DSA Concepts', 'Hard', 'What is Union-Find (Disjoint Set Union)?', [
    "**Union-Find** tracks a collection of elements split into **disjoint groups**, and supports two operations very quickly:",
    L("**find(x)**: which group is `x` in? It returns the group's representative (its root).",
      "**union(a, b)**: merge the groups containing `a` and `b`."),
    "Each group is stored as a tree of parent pointers; the root is the representative. Two optimisations make it extremely fast:",
    L("**Path compression**: during `find`, point every visited node directly at the root, so later finds are almost instant.",
      "**Union by rank (or size)**: attach the smaller tree under the larger one, so trees stay shallow."),
    "With both, each operation costs **O(alpha(n))** amortised, where alpha is the inverse Ackermann function. It is at most 4 for any realistic n, so effectively constant.",
    "Where it is used:",
    L("**Kruskal's minimum spanning tree**: add the cheapest edges that do not connect two nodes already in the same group.",
      "**Cycle detection** in an undirected graph: an edge whose two ends are already in the same group closes a cycle.",
      "**Counting connected components**, such as \"number of provinces\" or friend circles, and grouping accounts that share an email.",
      "Dynamic connectivity problems where edges arrive one by one."),
    "Interview tip: write the 15-line class from memory. It turns several \"hard\" graph problems into easy ones."
  ], C`
class DSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.size = [1] * n
        self.groups = n

    def find(self, x):
        root = x
        while self.parent[root] != root:
            root = self.parent[root]
        while self.parent[x] != root:            # path compression
            self.parent[x], x = root, self.parent[x]
        return root

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False                         # already connected: a cycle
        if self.size[ra] < self.size[rb]:        # union by size
            ra, rb = rb, ra
        self.parent[rb] = ra
        self.size[ra] += self.size[rb]
        self.groups -= 1
        return True

dsu = DSU(6)
for a, b in [(0, 1), (1, 2), (3, 4)]:
    dsu.union(a, b)
print("groups:", dsu.groups)                     # 3: {0,1,2} {3,4} {5}
print("edge 0-2 makes a cycle:", not dsu.union(0, 2))`),

  // ---------------- Operating Systems ----------------
  Q(167, 'Operating Systems', 'Easy', 'What are the states of a process, and what is a PCB?', [
    "A **process** is a program in execution. During its life it moves through a set of states:",
    L("**New**: being created; the OS is setting up its memory and structures.",
      "**Ready**: loaded in memory and able to run, waiting for the scheduler to give it a CPU.",
      "**Running**: its instructions are executing on a CPU core.",
      "**Waiting (blocked)**: it cannot continue until an event happens, such as disk I/O finishing, a network packet arriving or a lock being released.",
      "**Terminated**: finished; the OS is cleaning up."),
    "The transitions: Ready to Running (the scheduler dispatches it), Running to Ready (its time slice ends or a higher-priority process arrives, which is **preemption**), Running to Waiting (it requests I/O), Waiting to Ready (the I/O completes). Some systems add **suspended** states when a process is swapped out to disk.",
    "The **Process Control Block (PCB)** is the kernel's record for each process. It holds everything needed to stop the process and resume it later:",
    L("process id (PID), parent id, state and priority;",
      "saved **CPU registers** and the **program counter**;",
      "memory-management information (page tables, limits);",
      "open files and I/O devices;",
      "accounting information such as CPU time used."),
    "On a context switch, the OS saves the running process's registers into its PCB and loads the next process's PCB.",
    "Interview tip: draw the five states as boxes with labelled arrows. It is the expected answer format."
  ]),

  Q(168, 'Operating Systems', 'Medium', 'Explain the producer-consumer problem.', [
    "The **producer-consumer** (bounded-buffer) problem is the classic synchronisation problem. One or more **producers** create items and put them into a buffer of fixed size; one or more **consumers** take items out. Three rules must hold:",
    N("A producer must **wait** when the buffer is **full**.",
      "A consumer must **wait** when the buffer is **empty**.",
      "Only one thread may change the buffer at a time (**mutual exclusion**), or items can be lost or read twice."),
    "The textbook solution uses three synchronisation objects:",
    L("a **mutex** (or binary semaphore) protecting the buffer;",
      "a counting semaphore `empty`, initialised to the buffer size, counting free slots;",
      "a counting semaphore `full`, initialised to 0, counting filled slots."),
    "A producer does `wait(empty)`, `lock`, add item, `unlock`, `signal(full)`. A consumer does `wait(full)`, `lock`, remove item, `unlock`, `signal(empty)`. Acquiring the mutex **before** waiting on `empty` would deadlock: a producer holding the lock would sleep on a full buffer while no consumer could get in.",
    "In real code you rarely build this by hand: Python's `queue.Queue(maxsize=n)`, Java's `BlockingQueue` and Go channels already implement it. The same pattern appears at system scale as **message queues** (Kafka, RabbitMQ) between services.",
    "Interview tip: explain why the order of the waits matters. It shows you understand deadlock, not just the recipe."
  ], C`
import threading
import time

BUFFER_SIZE = 3
buffer = []
mutex = threading.Lock()
empty = threading.Semaphore(BUFFER_SIZE)   # free slots
full = threading.Semaphore(0)              # filled slots

def producer(count):
    for i in range(count):
        empty.acquire()                    # wait for a free slot FIRST
        with mutex:                        # then lock the buffer
            buffer.append(i)
            print(f"produced {i}  buffer={buffer}")
        full.release()

def consumer(count):
    for _ in range(count):
        full.acquire()                     # wait for an item
        with mutex:
            item = buffer.pop(0)
            print(f"consumed {item}  buffer={buffer}")
        empty.release()
        time.sleep(0.01)                   # slower consumer: producer will block

threads = [threading.Thread(target=producer, args=(6,)), threading.Thread(target=consumer, args=(6,))]
for t in threads:
    t.start()
for t in threads:
    t.join()`),

  Q(169, 'Operating Systems', 'Medium', 'Explain page replacement algorithms: FIFO, LRU and Optimal.', [
    "When a program touches a page that is not in RAM, a **page fault** occurs and the OS loads it from disk. If all frames are full, it must choose a **victim page** to evict. The goal is to minimise future page faults.",
    L("**FIFO**: evict the page that has been in memory the longest. Simple, but it may throw out a heavily used page. It also suffers from **Belady's anomaly**: adding more frames can, surprisingly, increase the number of faults.",
      "**Optimal (OPT)**: evict the page that will not be used for the **longest time in the future**. It gives the fewest possible faults but needs knowledge of the future, so it is used only as a benchmark.",
      "**LRU (Least Recently Used)**: evict the page that has not been used for the longest time, using the recent past to predict the near future. Close to optimal in practice and free of Belady's anomaly. Exact LRU needs hardware support (timestamps or a stack on every access), so real kernels approximate it."),
    "The practical approximation is the **Clock (second-chance)** algorithm: each page has a reference bit set by hardware on access. A clock hand sweeps the frames; a page with bit 1 gets a second chance (the bit is cleared), and the first page found with bit 0 is evicted. Linux uses a related two-list (active and inactive) scheme.",
    "Interview tip: you will often get a reference string and a frame count to trace by hand. The simulation below lets you check such answers."
  ], C`
from collections import OrderedDict, deque

def fifo(refs, frames):
    memory, order, faults = set(), deque(), 0
    for p in refs:
        if p not in memory:
            faults += 1
            if len(memory) == frames:
                memory.remove(order.popleft())
            memory.add(p)
            order.append(p)
    return faults

def lru(refs, frames):
    memory, faults = OrderedDict(), 0
    for p in refs:
        if p in memory:
            memory.move_to_end(p)               # most recently used
        else:
            faults += 1
            if len(memory) == frames:
                memory.popitem(last=False)      # evict least recently used
            memory[p] = True
    return faults

def optimal(refs, frames):
    memory, faults = [], 0
    for i, p in enumerate(refs):
        if p in memory:
            continue
        faults += 1
        if len(memory) == frames:
            future = refs[i + 1:]
            victim = max(memory, key=lambda q: future.index(q) if q in future else len(future) + 1)
            memory.remove(victim)
        memory.append(p)
    return faults

refs = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2]
print("FIFO:", fifo(refs, 3), "LRU:", lru(refs, 3), "OPT:", optimal(refs, 3))

belady = [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5]
print("Belady's anomaly, FIFO with 3 vs 4 frames:", fifo(belady, 3), fifo(belady, 4))   # 9 vs 10`),

  Q(170, 'Operating Systems', 'Hard', "How are deadlocks prevented or avoided? Explain the Banker's algorithm.", [
    "A deadlock needs all four Coffman conditions at once: **mutual exclusion**, **hold and wait**, **no preemption** and **circular wait**. There are four broad strategies:",
    L("**Prevention**: design the system so at least one condition can never hold. Request all resources at once (breaks hold and wait); allow resources to be taken away (breaks no preemption); or, the most practical, **acquire locks in a fixed global order** (breaks circular wait).",
      "**Avoidance**: before granting each request, check that the system stays in a **safe state**. This is the Banker's algorithm.",
      "**Detection and recovery**: let deadlocks happen, detect cycles in a wait-for graph, then recover by killing or rolling back a process. Databases do this with transactions.",
      "**Ignore it** (the \"ostrich algorithm\"): accept rare deadlocks and reboot. Most desktop operating systems do this for user programs."),
    "The **Banker's algorithm** (Dijkstra) needs each process to declare its **maximum** need in advance. A state is **safe** if there is some order in which every process can obtain its remaining need and finish, releasing its resources for the next. A request is granted only if the resulting state is still safe.",
    "The safety check: `need = max - allocation`. Start with `work = available`. Repeatedly find a process whose `need <= work`, pretend it finishes (`work += its allocation`) and mark it done. If all processes finish, the state is safe and the order found is a **safe sequence**.",
    "It is rarely used in general-purpose OSes because maximum needs are seldom known in advance, but it is a favourite exam and interview question.",
    "Interview tip: for practical code, say \"I prevent deadlocks by always taking locks in the same order\". That is what engineers actually do."
  ], C`
def is_safe(available, maximum, allocation):
    n, m = len(maximum), len(available)
    need = [[maximum[i][j] - allocation[i][j] for j in range(m)] for i in range(n)]
    work, finished, sequence = available[:], [False] * n, []
    while len(sequence) < n:
        progressed = False
        for i in range(n):
            if not finished[i] and all(need[i][j] <= work[j] for j in range(m)):
                work = [work[j] + allocation[i][j] for j in range(m)]   # P_i finishes
                finished[i] = True
                sequence.append(f"P{i}")
                progressed = True
        if not progressed:
            return False, sequence           # nobody can finish: unsafe
    return True, sequence

# Classic textbook example: 5 processes, resources A, B, C
available = [3, 3, 2]
maximum = [[7, 5, 3], [3, 2, 2], [9, 0, 2], [2, 2, 2], [4, 3, 3]]
allocation = [[0, 1, 0], [2, 0, 0], [3, 0, 2], [2, 1, 1], [0, 0, 2]]
print(is_safe(available, maximum, allocation))   # (True, ['P1', 'P3', 'P4', 'P0', 'P2'])`),

  Q(171, 'Operating Systems', 'Medium', 'Starvation vs deadlock: what is the difference, and what is aging?', [
    "Both mean a process cannot make progress, but for different reasons.",
    L("**Deadlock**: a set of processes are **all blocked forever**, each waiting for a resource held by another in the set. Nothing in the set can ever move without outside intervention. Deadlocked processes use no CPU; they just sit.",
      "**Starvation** (indefinite blocking): a process is **ready** to run, but **keeps losing** to others, so it waits indefinitely while the rest of the system works fine. It is a fairness problem, not a circular wait."),
    "Common causes of starvation:",
    L("**Priority scheduling**: a steady stream of high-priority jobs means a low-priority job never runs.",
      "**Shortest Job First**: long jobs keep being pushed back by short ones.",
      "**Unfair locks**: a reader-preferring readers-writers lock can starve writers when readers keep arriving."),
    "**Aging** is the standard fix: gradually **raise the priority** of a process the longer it waits, so eventually it becomes the highest priority and runs. Other fixes: round-robin or other fair schedulers, and fair (FIFO) locks.",
    "A related term is **livelock**: processes keep actively changing state in response to each other (like two people stepping aside in a corridor in the same direction) without making progress. Unlike deadlock, they are using CPU.",
    "Interview tip: the one-line contrast is \"deadlock: nobody in the group can move; starvation: one process never gets its turn\"."
  ], C`
# Priority scheduling: a new high-priority web request arrives every tick
def schedule(ticks, aging_rate):
    ready = [{"name": "backup (low)", "priority": 1, "waited": 0}]
    ran = []
    for t in range(ticks):
        ready.append({"name": f"web {t}", "priority": 5, "waited": 0})
        job = max(ready, key=lambda j: j["priority"] + aging_rate * j["waited"])
        ready.remove(job)
        ran.append(job["name"])
        for j in ready:
            j["waited"] += 1                 # everyone still waiting gets older
    return ran

no_aging = schedule(12, aging_rate=0)
with_aging = schedule(12, aging_rate=1)
print("without aging, backup ran:", "backup (low)" in no_aging)          # False: starved
print("with aging, backup ran at tick", with_aging.index("backup (low)"))  # 4`),

  Q(172, 'Operating Systems', 'Medium', 'What do fork() and exec() do? What are zombie and orphan processes?', [
    "On Unix-like systems, new programs are started in two steps:",
    L("**fork()** creates a new process that is an almost exact **copy of the parent**: same code, a copy of its memory (shared efficiently with **copy-on-write**), and the same open files. It returns **twice**: `0` in the child and the child's PID in the parent. That is how each side knows which one it is.",
      "**exec()** (the `execve` family) **replaces** the current process's program with a new one, keeping the same PID and open files. A shell runs `ls` by forking itself, then calling `exec(\"ls\")` in the child, while the parent calls `wait()`."),
    "Splitting the steps lets the child adjust things between them, such as redirecting output to a file (`ls > out.txt`) or setting up a pipe, before the new program starts.",
    "When processes end, two special cases can occur:",
    L("**Zombie process**: the child has **exited**, but the parent has not yet called `wait()` to read its exit status. The child's resources are freed, but its entry in the process table stays, shown as `<defunct>` or state `Z` in `ps`. A few are harmless; a parent that never waits can fill the process table. Fix: call `wait()`/`waitpid()`, or handle `SIGCHLD`.",
      "**Orphan process**: the **parent exits first** while the child is still running. The orphan is adopted by `init` (PID 1, often `systemd`), which reaps it when it finishes, so orphans are not a problem by themselves. Daemons are deliberately orphaned."),
    "Windows has no fork; `CreateProcess` creates a process and loads a program in one step.",
    "Interview tip: remember the phrase \"fork returns twice\". Interviewers frequently ask how many processes `fork(); fork();` creates: the answer is 4 (2 to the power of the number of forks)."
  ], C`
# Unix only (Linux/macOS): os.fork does not exist on Windows
import os
import time

pid = os.fork()
if pid == 0:                                   # child
    print(f"child  pid={os.getpid()} parent={os.getppid()}")
    os.execvp("echo", ["echo", "child replaced itself with echo"])
else:                                          # parent
    time.sleep(0.2)                            # child is a zombie until we wait
    _, status = os.waitpid(pid, 0)             # reap it
    print(f"parent reaped child {pid}, exit code {os.waitstatus_to_exitcode(status)}")`, 'python-unix'),

  Q(173, 'Operating Systems', 'Medium', 'Paging vs segmentation?', [
    "Both are ways to map a process's logical addresses to physical memory.",
    L("**Paging** splits logical memory into **fixed-size pages** (commonly 4 KB) and physical memory into frames of the same size. Any page can go in any free frame, and a **page table** maps page numbers to frame numbers. It eliminates **external fragmentation** (no awkward holes between allocations), but the last page of each region is partly unused, causing small **internal fragmentation**. Paging is invisible to the programmer.",
      "**Segmentation** splits memory into **variable-size logical segments** that match the program's structure: code, data, stack, heap. Each address is a (segment, offset) pair, checked against the segment's base and limit in a **segment table**. It supports protection and sharing per segment naturally (code read-only, stack growable) but suffers from **external fragmentation**, because variable-size blocks leave gaps."),
    "Comparison at a glance:",
    L("Size: paging fixed; segmentation variable.",
      "Visible to the programmer: paging no; segmentation yes (logical units).",
      "Fragmentation: paging internal only; segmentation external.",
      "Table: page table (page to frame); segment table (base and limit)."),
    "Many systems combined them (**segmented paging**, as in classic x86: each segment is itself paged). Modern 64-bit x86 and ARM operating systems use **paging almost exclusively**, with segmentation reduced to a flat model.",
    "Interview tip: tie each scheme to its fragmentation type. That pairing is the core of the expected answer."
  ]),

  Q(174, 'Operating Systems', 'Hard', 'How is a virtual address translated, and what is a TLB?', [
    "With paging, every virtual address is split into two parts: the **page number** (high bits) and the **offset** within the page (low bits). With 4 KB pages, the offset is the lowest 12 bits, because 2 to the 12th is 4096.",
    N("The MMU (memory management unit) takes the page number and looks it up in the process's **page table** to find the **frame number**.",
      "The physical address is `frame number x page size + offset`; the offset does not change.",
      "If the page-table entry is marked not present, the CPU raises a **page fault** and the OS loads the page from disk.",
      "Permission bits in the entry (read, write, execute, user or kernel) are checked; a violation raises a fault, such as a segmentation fault."),
    "Page tables for 64-bit address spaces are huge, so they are **multi-level** (x86-64 uses 4 or 5 levels). That means one memory access could require several extra memory accesses just to walk the table, which would be far too slow.",
    "The **TLB (Translation Lookaside Buffer)** solves this: it is a small, very fast cache inside the CPU that stores recent page-number to frame-number translations.",
    L("**TLB hit**: translation in about one cycle.",
      "**TLB miss**: walk the page table, then cache the result.",
      "Hit rates are typically above 99% thanks to locality of reference.",
      "On a context switch the TLB entries belong to the old process, so they are flushed, or tagged with an address-space id (ASID/PCID) to avoid a full flush. This is one reason context switches are expensive.",
      "**Huge pages** (2 MB or 1 GB) let one TLB entry cover much more memory."),
    "Interview tip: compute the effective access time: with a 99% hit rate, a 1 ns TLB and a 100 ns memory access, it is about 0.99 x 101 + 0.01 x 201 = 102 ns, close to a single memory access."
  ], C`
PAGE_SIZE = 4096                      # 4 KB pages, so 12 offset bits
OFFSET_BITS = PAGE_SIZE.bit_length() - 1

page_table = {0: 5, 1: 9, 2: None, 3: 2}   # page -> frame (None = on disk)
tlb = {}
stats = {"hit": 0, "miss": 0}

def translate(vaddr):
    page, offset = vaddr >> OFFSET_BITS, vaddr & (PAGE_SIZE - 1)
    if page in tlb:
        stats["hit"] += 1
        frame = tlb[page]
    else:
        stats["miss"] += 1
        frame = page_table.get(page)
        if frame is None:
            return f"0x{vaddr:05x}: page fault on page {page}"
        tlb[page] = frame
    return f"0x{vaddr:05x}: page {page} offset {offset} -> physical 0x{frame * PAGE_SIZE + offset:05x}"

for addr in (0x0004, 0x1A2B, 0x1A30, 0x2010, 0x3FFF, 0x0008):
    print(translate(addr))
print(stats)                           # repeated pages hit the TLB`),

  Q(175, 'Operating Systems', 'Medium', 'What is inter-process communication (IPC)? Name the main methods.', [
    "Processes have **separate address spaces**, so one cannot simply read another's variables. **IPC** is the set of OS mechanisms that let them exchange data and coordinate.",
    "The main methods:",
    L("**Pipes**: a one-way byte stream, typically between parent and child. The shell's `ps aux | grep python` connects two processes this way. **Named pipes (FIFOs)** have a filesystem name, so unrelated processes can use them.",
      "**Message queues**: the kernel stores discrete, possibly prioritised messages until the receiver reads them.",
      "**Shared memory**: the OS maps the same physical memory into several processes. It is the **fastest** method, because data is not copied through the kernel, but the processes must synchronise access themselves with semaphores or mutexes.",
      "**Sockets**: bidirectional communication on the same machine (Unix domain sockets) or across a network (TCP/UDP). Most client-server and microservice communication uses them.",
      "**Signals**: tiny asynchronous notifications such as `SIGTERM` or `SIGKILL`, carrying no data beyond the signal number.",
      "**Memory-mapped files** and plain files, and higher-level tools such as RPC/gRPC and message brokers built on sockets."),
    "Choosing: shared memory for very high throughput on one machine; pipes for simple parent-child streams; sockets when processes may live on different machines; message queues when sender and receiver should be decoupled.",
    "Interview tip: mention that shared memory is fastest but needs explicit synchronisation. That trade-off is the usual follow-up."
  ], C`
from multiprocessing import Pipe, Process, Queue, Value

def worker(conn, results, counter):
    task = conn.recv()                       # pipe: message from parent
    results.put(f"processed {task!r}")       # queue: result back to parent
    with counter.get_lock():
        counter.value += 1                   # shared memory, synchronised
    conn.send("done")
    conn.close()

if __name__ == "__main__":
    parent_end, child_end = Pipe()
    results, counter = Queue(), Value("i", 0)
    p = Process(target=worker, args=(child_end, results, counter))
    p.start()
    parent_end.send("resize image 42")
    print(parent_end.recv(), "|", results.get(), "| counter =", counter.value)
    p.join()`),

  Q(176, 'Operating Systems', 'Easy', 'Multiprogramming vs multitasking vs multithreading vs multiprocessing?', [
    "These four terms are easy to mix up. Each solves a different problem:",
    L("**Multiprogramming**: several programs are kept in memory, and when the running one waits for I/O, the CPU switches to another. The goal is to **keep the CPU busy**. It is the oldest of the four ideas (batch systems).",
      "**Multitasking (time-sharing)**: multiprogramming plus **time slices**: the OS rapidly switches between tasks, even when none is waiting, so that many users or applications feel they run at once. The goal is **responsiveness**. Modern OSes use **preemptive** multitasking.",
      "**Multithreading**: one process contains **several threads** that share its memory and resources but have their own stacks and registers. Used for parallel work inside one application (a browser rendering while downloading). Cheap to create and communicate, but shared memory needs synchronisation.",
      "**Multiprocessing**: the system has **two or more CPUs or cores** that execute truly in parallel. In programming, it also means using several processes, each with its own memory, to use those cores."),
    "Key distinction: **concurrency** is dealing with many tasks at once by interleaving them (possible on one core); **parallelism** is doing many tasks at the same instant (needs several cores). Multitasking and multithreading give concurrency; multiprocessing hardware gives parallelism.",
    "In Python, because of the GIL, CPU-heavy work uses **multiprocessing**, while I/O-heavy work uses threads or asyncio.",
    "Interview tip: finish with the concurrency vs parallelism distinction. Interviewers often ask it next."
  ], C`
import time
from concurrent.futures import ProcessPoolExecutor

def count_primes(limit):                     # CPU-bound work
    count = 0
    for n in range(2, limit):
        if all(n % d for d in range(2, int(n ** 0.5) + 1)):
            count += 1
    return count

if __name__ == "__main__":
    chunks = [60_000] * 4

    start = time.perf_counter()
    serial = [count_primes(c) for c in chunks]
    t_serial = time.perf_counter() - start

    start = time.perf_counter()
    with ProcessPoolExecutor() as pool:      # separate processes use separate cores
        parallel = list(pool.map(count_primes, chunks))
    t_parallel = time.perf_counter() - start

    print(serial == parallel, f"serial {t_serial:.2f}s, processes {t_parallel:.2f}s")`),

  Q(177, 'Operating Systems', 'Hard', 'What is the critical section problem? What must a solution guarantee?', [
    "A **critical section** is a part of a program that accesses **shared data** (a counter, a linked list, a file). If two threads run their critical sections at the same time, the result depends on timing, which is a race condition. The **critical section problem** is designing an entry and exit protocol around it so that cooperation is safe.",
    "A correct solution must guarantee three properties:",
    N("**Mutual exclusion**: at most one process is inside its critical section at any time.",
      "**Progress**: if no process is inside and some want to enter, the choice of who enters next cannot be postponed forever, and only processes trying to enter take part in the decision.",
      "**Bounded waiting**: after a process asks to enter, there is a limit on how many times others can enter before it does. This rules out starvation."),
    "Solutions, from low level to high level:",
    L("**Peterson's algorithm**: a pure-software solution for two processes using a `flag` array and a `turn` variable. It is correct in theory, but on modern CPUs, which reorder memory operations, it needs memory barriers to work.",
      "**Hardware instructions**: atomic `test-and-set` and `compare-and-swap` (CAS) are the basis of spinlocks and lock-free data structures.",
      "**Mutexes and semaphores** provided by the OS, which put waiting threads to sleep instead of spinning.",
      "**Monitors**: language-level constructs such as Java's `synchronized` methods, or a lock plus condition variables."),
    "**Spinlock vs blocking lock**: a spinlock busy-waits in a loop, which is good only when the wait is very short and on multi-core machines (kernels use them); a blocking mutex sleeps, which wastes no CPU but costs a context switch.",
    "Interview tip: list the three properties by name. Many candidates know only mutual exclusion."
  ]),
];
