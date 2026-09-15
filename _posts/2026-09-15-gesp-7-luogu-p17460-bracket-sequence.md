---
layout: post
title: 【括号序列平衡度与子序列计数DP】GESP七级 / CSP-S 题解：luogu-P17460 [GESP202609 七级] 括号序列
date: 2026-09-15 17:30:00 +0800
author: OneCoder
comments: true
math: true
tags: [GESP, C++, GESP七级, CSP-S, 动态规划, 括号序列, 计数DP]
categories: [GESP, 七级, 动态规划, CSP-S]
---

CCF GESP 2026年9月认证（第十五次认证）C++ 七级试题，洛谷 P17460。本题严格遵循 CCF GESP 官方大纲规范，重点考察**括号序列平衡度与子序列计数DP**。题目逻辑严密，模型典型，是深入理解与掌握信奥核心考点的经典范例。

<!--more-->

## P17460 [luogu-P17460 [GESP202609 七级] 括号序列]

> 🔗 **洛谷原题传送门**：[P17460](https://www.luogu.com.cn/problem/P17460)

### 题目要求

#### 题目描述

给定长度为 $n$ 的仅包含 `(` 与 `)` 的字符串 $S$。求 $S$ 所有 $2^n$ 个子序列中有多少个是合法括号序列（空串也算合法）。答案对 $10^9$ 取模。

#### 输入格式

第一行一个正整数 $n$。
第二行长度为 $n$ 的括号串 $S$。

#### 输出格式

输出一个整数，表示合法括号子序列数对 $10^9$ 取模的结果。

#### 输入输出样例

##### 样例输入 #1

```text
6
))(()(
```

##### 样例输出 #1

```text
3
```

#### 说明/提示

$1 \le n \le 2000$。对于 34 个连续左括号接 34 个右括号，答案为 333606220。

---

### 题目分析与解题思路

1. **合法括号序列充要条件**：
   任意前缀中未匹配的左括号数量（净差值 $j$）时刻 $\ge 0$，且最终整个序列结束时净差值恰好为 0。
2. **动态规划状态定义**：
   设 $dp[j]$ 表示在当前扫描到的前缀中，所有选出的子序列里未匹配左括号数为 $j$（即净差值为 $j$）的子序列方案数。
   初始状态：$dp[0] = 1$（空子序列），其余均为 0。
3. **转移逻辑**：
   依次扫描字符 $c \in S$：
   - 若 $c == '('$：可以选择不选（方案数不变），或者选入当前左括号（净差值从 $j-1$ 变为 $j$）：
     $$dp[j] = (dp[j] + dp[j-1]) \bmod 10^9 \quad (j = n \dots 1)$$
   - 若 $c == ')'$：可以选择不选，或者选入当前右括号（净差值从 $j+1$ 变为 $j$）：
     $$dp[j] = (dp[j] + dp[j+1]) \bmod 10^9 \quad (j = 0 \dots n)$$
4. **复杂度**：时间复杂度 $\mathcal{O}(n^2) = 4 \times 10^6$，空间利用一维滚动数组仅需 $\mathcal{O}(n)$，毫秒级通过。

---

### 完整参考代码 (C++11)

```cpp
/**
 * Problem: luogu-P17460
 * Standard: C++11 (CCF GESP 官方大纲规范)
 * Author: OneCoder
 */

#include <iostream>
#include <vector>
#include <string>

using namespace std;

const int MOD = 1000000000;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    if (!(cin >> n)) return 0;
    string s;
    cin >> s;

    // dp[j] 表示净左括号数为 j 的子序列总数
    vector<int> dp(n + 2, 0);
    dp[0] = 1;

    for (char c : s) {
        if (c == '(') {
            // 逆序更新避免后效性
            for (int j = n; j >= 1; --j) {
                dp[j] = (dp[j] + dp[j - 1]) % MOD;
            }
        } else if (c == ')') {
            // 顺序更新净差值减少
            for (int j = 0; j <= n; ++j) {
                dp[j] = (dp[j] + dp[j + 1]) % MOD;
            }
        }
    }

    cout << dp[0] << "\n";

    return 0;
}
```

---

### 考点归纳与备考建议

1. **考纲匹配度**：严格对标 CCF GESP 七级考纲重点，绝不超纲，注重基础算法与逻辑建模规范；
2. **规范防范**：所有代码严格以 C++11 标准编译运行，针对整数溢出、边界判断、空状态均做了详尽严整的防御性处理。
