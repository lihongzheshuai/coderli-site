---
layout: post
title: 【树形结构DFS与子树平衡度极小化】GESP六级 / CSP-J 题解：luogu-P17458 [GESP202609 六级] 分树规划
date: 2026-09-15 15:55:00 +0800
author: OneCoder
comments: true
math: true
tags: [GESP, C++, GESP六级, CSP-J, 树形结构, DFS, 贪心, 真题, 2026年9月, GESP202609]
categories: [GESP, 六级, 树与二叉树, CSP-J]
---

CCF GESP 2026年9月认证（第十五次认证）C++ 六级试题，洛谷 P17458。本题严格遵循 CCF GESP 官方大纲规范，重点考察**树形结构DFS与子树平衡度极小化**。题目逻辑严密，模型典型，是深入理解与掌握信奥核心考点的经典范例。

<!--more-->

## P17458 [luogu-P17458 [GESP202609 六级] 分树规划]

> 🔗 **洛谷原题传送门**：[P17458](https://www.luogu.com.cn/problem/P17458)

### 题目要求

#### 题目描述

一棵有 $n$ 个结点的树。老师选择一条边删去，将树分为两个连通块，两位同学各得其一。
为了避免两位同学得到的连通块结点数差距过大，求两个连通块结点数之差绝对值的最小值。

#### 输入格式

第一行一个正整数 $n$。
接下来 $n-1$ 行每行两个整数 $u, v$ 表示一条边。

#### 输出格式

输出一行，一个整数，表示差值绝对值的最小值。

#### 输入输出样例

##### 样例输入 #1

```text
4
1 2
2 3
3 4
```

##### 样例输出 #1

```text
0
```

#### 说明/提示

$2 \le n \le 2 \times 10^4$。

---

### 题目分析与解题思路

1. **树上删边与子树大小对应关系**：
   任选树中一个结点作为根（如结点 1），树中任意一条非根结点的连父边 $(u, \text{parent}[u])$ 被删去后，所得的两个连通块大小恰好分别为：
   - 以 $u$ 为根的子树大小 $sz[u]$；
   - 其余部分的大小 $n - sz[u]$。
2. **差值计算**：
   两连通块大小之差的绝对值为：
   $$|sz[u] - (n - sz[u])| = |2 \cdot sz[u] - n|$$
3. **单次 DFS 遍历**：
   在后序遍历过程中自底向上累加子树大小 $sz[u] = 1 + \sum_{v \in \text{children}} sz[v]$，并在 $u \ne 1$ 时同步更新全局最小值。时间复杂度为严整的 $\mathcal{O}(n)$。

---

### 完整参考代码 (C++11)

```cpp
/**
 * Problem: luogu-P17458
 * Standard: C++11 (CCF GESP 官方大纲规范)
 * Author: OneCoder
 */

#include <iostream>
#include <vector>
#include <cmath>
#include <algorithm>

using namespace std;

const int MAXN = 20005;
vector<int> adj[MAXN];
int sz_arr[MAXN];
int n;
int min_diff = 1e9;

// DFS 自底向上统计子树大小
void dfs(int u, int p) {
    sz_arr[u] = 1;
    for (int v : adj[u]) {
        if (v != p) {
            dfs(v, u);
            sz_arr[u] += sz_arr[v];
        }
    }
    if (u != 1) {
        int diff = abs(2 * sz_arr[u] - n);
        if (diff < min_diff) {
            min_diff = diff;
        }
    }
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    if (!(cin >> n)) {
        return 0;
    }

    for (int i = 0; i < n - 1; ++i) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
        adj[v].push_back(u);
    }

    dfs(1, 0);

    cout << min_diff << "\n";

    return 0;
}
```

---

### 考点归纳与备考建议

1. **考纲匹配度**：严格对标 CCF GESP 六级考纲重点，绝不超纲，注重基础算法与逻辑建模规范；
2. **规范防范**：所有代码严格以 C++11 标准编译运行，针对整数溢出、边界判断、空状态均做了详尽严整的防御性处理。
