---
layout: post
title: 【GESP真题】GESP四级 / CSP-J 题解：luogu-B4580 [GESP202609 四级] 有序网格
date: 2026-09-15 15:35:00 +0800
author: OneCoder
comments: true
math: true
tags: [GESP, C++, GESP四级, CSP-J, 二维数组, 排序, 真题, 2026年9月, GESP202609]
categories: [GESP, 四级, 二维数组, CSP-J]
---

CCF GESP 2026年9月认证（第十五次认证）C++ 四级试题，洛谷 B4580。本题严格遵循 CCF GESP 官方大纲规范，重点考察**二维数组与行列双重排序**。题目逻辑严密，模型典型，是深入理解与掌握信奥核心考点的经典范例。

<!--more-->

## B4580 [luogu-B4580 [GESP202609 四级] 有序网格]

> 🔗 **洛谷原题传送门**：[B4580](https://www.luogu.com.cn/problem/B4580)

### 题目要求

#### 题目描述

小 A 有一个 $n$ 行 $m$ 列格子组成的二维网格。小 A 想让二维网格变得有序，因此他先对每一行从左到右按升序排序，再对每一列从上到下按升序排序。
请编写程序求出二维网格经过以上两次排序后的最终结果。

#### 输入格式

第一行两个正整数 $n, m$，表示行数与列数。
接下来 $n$ 行，每行 $m$ 个整数表示网格中的数字。

#### 输出格式

输出 $n$ 行，每行 $m$ 个整数，表示先后完成行排序与列排序后的网格。

#### 输入输出样例

##### 样例输入 #1

```text
3 2
6 5
4 3
2 1
```

##### 样例输出 #1

```text
1 2
3 4
5 6
```

#### 说明/提示

$2 \le n, m \le 10$，$1 \le a_{i,j} \le 100$。

---

### 题目分析与解题思路

1. **二维网格操作模型**：
   题目步骤非常明确，属于标准的两阶段模拟与排序考点：
   - **第一阶段（行排序）**：固定行索引 $i$，对第 $i$ 行的元素 `grid[i][0 ... m-1]` 直接调用 `std::sort(grid[i], grid[i] + m)` 执行升序排序；
   - **第二阶段（列排序）**：固定列索引 $j$，取出第 $j$ 列的全部 $n$ 个元素放入临时数组或向量 `col`，排序后再依次写回第 $j$ 列。
2. **数据规模极小**：$n, m \le 10$，总元素最多 100 个，耗时微乎其微。

---

### 完整参考代码 (C++11)

```cpp
/**
 * Problem: luogu-B4580
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

    int n, m;
    if (!(cin >> n >> m)) {
        return 0;
    }

    int grid[15][15];
    for (int i = 0; i < n; ++i) {
        for (int j = 0; j < m; ++j) {
            cin >> grid[i][j];
        }
    }

    // 1. 对每一行按升序排序
    for (int i = 0; i < n; ++i) {
        sort(grid[i], grid[i] + m);
    }

    // 2. 对每一列按升序排序
    for (int j = 0; j < m; ++j) {
        vector<int> col(n);
        for (int i = 0; i < n; ++i) {
            col[i] = grid[i][j];
        }
        sort(col.begin(), col.end());
        for (int i = 0; i < n; ++i) {
            grid[i][j] = col[i];
        }
    }

    // 3. 规整输出排序结果
    for (int i = 0; i < n; ++i) {
        for (int j = 0; j < m; ++j) {
            cout << grid[i][j] << (j + 1 == m ? "" : " ");
        }
        cout << "\n";
    }

    return 0;
}
```
