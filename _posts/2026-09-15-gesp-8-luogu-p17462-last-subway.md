---
layout: post
title: 【GESP真题】GESP八级 / CSP-S 题解：luogu-P17462 [GESP202609 八级] 末班车
date: 2026-09-15 16:15:00 +0800
author: OneCoder
comments: true
math: true
tags: [GESP, C++, GESP八级, CSP-S, 高级图论, 最短路, Dijkstra, 离线处理, 真题, 2026年9月, GESP202609]
categories: [GESP, 八级, 高级图论, CSP-S]
---

CCF GESP 2026年9月认证（第十五次认证）C++ 八级试题，洛谷 P17462。本题严格遵循 CCF GESP 官方大纲规范，重点考察**反向瓶颈最短路与Dijkstra最晚发车时间**。题目逻辑严密，模型典型，是深入理解与掌握信奥核心考点的经典范例。

<!--more-->

## P17462 [luogu-P17462 [GESP202609 八级] 末班车]

> 🔗 **洛谷原题传送门**：[P17462](https://www.luogu.com.cn/problem/P17462)

### 题目要求

#### 题目描述

城市有 $n$ 个地铁站，$m$ 条单向线路。第 $i$ 条线路最晚发车时间 $l_i$，运行时间 $t_i$，每分钟均有列车发出。
有 $q$ 组询问：给出起点 $x$、终点 $y$ 和出发时间 $s$，判断从 $x$ 于时刻 $s$ 出发能否到达 $y$。

#### 输入格式

第一行三个正整数 $n, m, q$。
接下来 $m$ 行每行四个整数 $u_i, v_i, l_i, t_i$。
接下来 $q$ 行每行三个整数 $x_i, y_i, s_i$。

#### 输出格式

输出 $q$ 行，能到达输出 `Yes`，否则输出 `No`。

#### 输入输出样例

##### 样例输入 #1

```text
3 4 5
1 2 3 3
2 3 5 2
3 1 4 1
1 3 0 6
1 3 2
2 1 2
2 1 3
3 2 2
3 2 3
```

##### 样例输出 #1

```text
Yes
Yes
No
Yes
No
```

#### 说明/提示

$1 \le n \le 500, 1 \le m \le 1000, 1 \le q \le 5 \times 10^5$。

---

### 题目分析与解题思路

1. **单调性与瓶颈最晚出发时间**：
   由于乘客可以在站点等待，若时刻 $s$ 能到达，则对于任何 $s' < s$ 也能到达。因此对于任意起点 $x$ 和终点 $y$，存在一个**最晚允许出发时间** $L[x][y]$，使得可行条件为 $s \le L[x][y]$。
2. **逆向动态规划与最大化 Dijkstra**：
   $n \le 500$ 极小，我们可以枚举终点 $y$：
   - 从终点 $y$ 出发在反向边上跑最大化 Dijkstra；
   - 设到达点 $v$ 能够继续前往 $y$ 的最晚时刻为 $cur_d$；
   - 对于原向边 $u \to v$（最晚发车 $l$，运行 $t$），若在时刻 $x$ 离开 $u$，到达 $v$ 为 $x + t$。要求 $x \le l$ 且 $x + t \le cur_d$，因此从 $u$ 最晚出发时刻为：
     $$nxt_d = \min(l, cur_d - t)$$
   - 使用大根堆不断拓展松弛最大的可出发时刻 $L[u][y]$。
3. **单次询问 $\mathcal{O}(1)$ 回答**：
   预处理全源最晚出发时间仅需 $n \times \mathcal{O}(m \log n) \approx 500 \times 1000 \times 9 \approx 4.5 \times 10^6$ 次运算（几十毫秒）。之后 $5 \times 10^5$ 次询问直接 $\mathcal{O}(1)$ 比较输出，整体高效平稳通过！

---

### 完整参考代码 (C++11)

```cpp
/**
 * Problem: luogu-P17462
 * Standard: C++11 (CCF GESP 官方大纲规范)
 * Author: OneCoder
 */

#include <iostream>
#include <vector>
#include <queue>
#include <algorithm>

using namespace std;

struct RevEdge {
    int u;
    long long l;
    long long t;
};

const long long INF = 2e18;
long long max_depart[505][505];

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m, q;
    if (!(cin >> n >> m >> q)) return 0;

    vector<vector<RevEdge>> rev_adj(n + 1);
    for (int i = 0; i < m; ++i) {
        int u, v;
        long long l, t;
        cin >> u >> v >> l >> t;
        rev_adj[v].push_back({u, l, t});
    }

    // 初始化全源可达最晚时刻表
    for (int i = 1; i <= n; ++i) {
        for (int j = 1; j <= n; ++j) {
            max_depart[i][j] = -1;
        }
    }

    // 对每个终点 y 跑反向最大化 Dijkstra
    for (int y = 1; y <= n; ++y) {
        priority_queue<pair<long long, int>> pq;
        max_depart[y][y] = INF;
        pq.push({INF, y});

        while (!pq.empty()) {
            auto top = pq.top();
            pq.pop();
            long long cur_d = top.first;
            int v = top.second;

            if (cur_d < max_depart[v][y]) continue;

            for (const auto& edge : rev_adj[v]) {
                int u = edge.u;
                long long nxt_d = min(edge.l, cur_d - edge.t);
                if (nxt_d >= 0 && nxt_d > max_depart[u][y]) {
                    max_depart[u][y] = nxt_d;
                    pq.push({nxt_d, u});
                }
            }
        }
    }

    // O(1) 快速回答每个询问
    for (int i = 0; i < q; ++i) {
        int x, y;
        long long s;
        cin >> x >> y >> s;
        if (s <= max_depart[x][y]) {
            cout << "Yes\n";
        } else {
            cout << "No\n";
        }
    }

    return 0;
}
```
