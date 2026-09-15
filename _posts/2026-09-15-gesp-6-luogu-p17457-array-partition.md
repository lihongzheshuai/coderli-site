---
layout: post
title: 【前缀和优化与线性动态规划】GESP六级 / CSP-J 题解：luogu-P17457 [GESP202609 六级] 数组划分
date: 2026-09-15 15:50:00 +0800
author: OneCoder
comments: true
math: true
tags: [GESP, C++, GESP六级, CSP-J, 动态规划, 前缀和]
categories: [GESP, 六级, 动态规划, CSP-J]
---

CCF GESP 2026年9月认证（第十五次认证）C++ 六级试题，洛谷 P17457。本题严格遵循 CCF GESP 官方大纲规范，重点考察**前缀和优化与线性动态规划**。题目逻辑严密，模型典型，是深入理解与掌握信奥核心考点的经典范例。

<!--more-->

## P17457 [luogu-P17457 [GESP202609 六级] 数组划分]

> 🔗 **洛谷原题传送门**：[P17457](https://www.luogu.com.cn/problem/P17457)

### 题目要求

#### 题目描述

给定 $n$ 个整数构成的数组 $A$。你需要将数组 $A$ 划分为若干非空连续子段，每个子段的偏差值定义为子段内整数和的平方。总偏差值定义为所有子段偏差值之和。
请你最小化划分方案的偏差值之和。

#### 输入格式

第一行一个正整数 $n$。
第二行 $n$ 个整数 $a_1, \dots, a_n$。

#### 输出格式

一行，一个整数，表示偏差值的最小值。

#### 输入输出样例

##### 样例输入 #1

```text
4
1 2 -3 4
```

##### 样例输出 #1

```text
6
```

#### 说明/提示

$1 \le n \le 2000, -100 \le a_i \le 100$。

---

### 题目分析与解题思路

1. **最优子结构与状态定义**：
   连续子段划分满足无后效性。定义 $dp[i]$ 表示将前缀 $A[1 \dots i]$ 划分为若干合法子段时的最小偏差值之和。
2. **状态转移方程**：
   枚举最后一个子段的起始位置 $j+1$（即上一个子段在 $j$ 处结束，其中 $0 \le j < i$）：
   $$dp[i] = \min_{0 \le j < i} \left( dp[j] + (prefix[i] - prefix[j])^2 \right)$$
   其中 $prefix[i] = \sum_{k=1}^i a_k$ 为前缀和。
3. **边界条件**：$dp[0] = 0$，其余初始化为正无穷 $\infty$。
4. **时间复杂度**：状态数 $\mathcal{O}(n)$，每个状态转移枚举 $\mathcal{O}(n)$，总时间复杂度 $\mathcal{O}(n^2)$。对于 $n \le 2000$，运算次数约 $2 \times 10^6$，在 $1\text{ s}$ 内轻松通过。

---

### 完整参考代码 (C++11)

```cpp
/**
 * Problem: luogu-P17457
 * Standard: C++11 (CCF GESP 官方大纲规范)
 * Author: OneCoder
 */

#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    if (!(cin >> n) || n <= 0) {
        return 0;
    }

    vector<long long> a(n + 1);
    vector<long long> prefix(n + 1, 0);
    for (int i = 1; i <= n; ++i) {
        cin >> a[i];
        prefix[i] = prefix[i - 1] + a[i];
    }

    const long long INF = 1e18;
    vector<long long> dp(n + 1, INF);
    dp[0] = 0; // 基础状态

    // O(n^2) 动态规划
    for (int i = 1; i <= n; ++i) {
        for (int j = 0; j < i; ++j) {
            long long seg_sum = prefix[i] - prefix[j];
            long long cost = dp[j] + seg_sum * seg_sum;
            if (cost < dp[i]) {
                dp[i] = cost;
            }
        }
    }

    cout << dp[n] << "\n";

    return 0;
}
```

---

### 考点归纳与备考建议

1. **考纲匹配度**：严格对标 CCF GESP 六级考纲重点，绝不超纲，注重基础算法与逻辑建模规范；
2. **规范防范**：所有代码严格以 C++11 标准编译运行，针对整数溢出、边界判断、空状态均做了详尽严整的防御性处理。
