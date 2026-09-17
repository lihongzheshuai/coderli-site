---
layout: post
title: 一起学Java(22)-[JDK篇]学习Java中String的字符编码和代理对机制
date: 2024-12-22 22:00 +0800
author: onecoder
comments: true
tags: [Java, JDK, 一起学Java]
categories: [一起学Java系列,（3）JDK篇]
---
上文[***《一起学Java(21)-[配置篇]Gradle控制台乱码问题配置和解决》***](https://www.coderli.com/java-go-21-gradle-idea-console-garbled/)中，我们解决了Gradle控制台字符乱码问题，这个问题实际是在研究Java String的字符编码机制时产生的。本文回归正题，研究下Java中String的字符编码和代理对机制。

<!--more-->

## Java 中 `String` 的字符编码与代理对机制

### **（一）背景：Unicode和UTF-16**

在理解代理对之前，我们需要先了解 `Unicode` 和 `UTF-16`。

- **Unicode**：`Unicode` 是一个字符集，它为世界上几乎所有的字符都分配了一个唯一的数字编号，这个编号被称为 **码点（Code Point）**。`Unicode` 的码点范围是从 `U+0000` 到 `U+10FFFF`，总共有 1,114,112 个码位。
- **UTF-16**：`UTF-16` 是一种 `Unicode` 的 **编码方式**。它使用 16 位（2 字节）或 32 位（4 字节）来表示一个 `Unicode` 字符。

#### **1. 基本多文种平面（BMP）和补充字符**

`Unicode` 将所有字符分为了 17 个平面（Plane），编号从 0 到 16。其中，第 0 号平面被称为 **基本多文种平面（Basic Multilingual Plane，BMP）**，其码点范围是 `U+0000` 到 `U+FFFF`。`BMP` 包含了最常用的字符，例如 `ASCII` 字符、拉丁字母、汉字等。

超出 `BMP` 的字符被称为 **补充字符（Supplementary Characters）**，它们的码点范围是 `U+010000` 到 `U+10FFFF`。这些字符包括一些不常用的汉字、古代文字、表情符号等。

#### **2. 代理对（Surrogate Pair）**

由于 `UTF-16` 使用 16 位来表示一个字符，因此 `BMP` 中的字符可以直接用一个 16 位的码元来表示。但是，对于补充字符，由于其码点超过了 16 位的表示范围，`UTF-16` 需要使用 **一对 16 位的码元** 来表示，这对码元就称为 **代理对（Surrogate Pair）**。

代理对由两个部分组成：

- **高位代理（High Surrogate）**：范围是 `U+D800` 到 `U+DBFF`。
- **低位代理（Low Surrogate）**：范围是 `U+DC00` 到 `U+DFFF`。

#### **3. 代理对的编码方式**

要将一个补充字符的码点转换为代理对，需要进行以下步骤：

1. 将码点减去 `0x10000`。
2. 将结果的高 10 位加 `0xD800`，得到高位代理。
3. 将结果的低 10 位加 `0xDC00`，得到低位代理。

例如，字符 `U+1F600`（笑脸表情😀）的转换过程如下：

1. `0x1F600 - 0x10000 = 0xF600`
2. 高 10 位：`0xF`，加 `0xD800` 得到 `0xD80F`
3. 低 10 位：`0x600`，加 `0xDC00` 得到 `0xDE00`

因此，`U+1F600` 的 `UTF-16` 编码为 **`0xD80F 0xDE00`**。

#### 4. **为什么需要代理对？**

- **Unicode 扩展**：代理对机制使得 UTF-16 编码可以表示超过基本多语言平面（BMP）范围的字符，即 Unicode 中的所有字符。UTF-16 本身是一个 16 位编码，但为了扩展字符的表示范围，它引入了代理对的概念。
  
- **支持多语言与符号**：Unicode 覆盖了全球几乎所有的语言字符和符号（包括表情符号、数学符号等），为了支持这些符号的表示，UTF-16 使用了代理对技术。

- **向后兼容**：代理对机制不会破坏 UTF-16 编码的向后兼容性，原本使用 2 字节表示的 BMP 字符不需要改变，同时对于超出 BMP 的字符引入了 4 字节表示。

### **（二）Java 中 `String` 的字符编码**

#### **1. 代理对字符如何存储**

在 Java 中，`String` 类使用 `UTF-16` 编码来存储字符串。这是因为 Java 语言设计之初，人们认为 16 位足以表示所有可能的字符。然而，这是一个不正确的判断。后来 `Unicode` 规范扩展到了超过16 位，所以 Java 中的字符现在可能由一对 16 位的值（称为“代理对”）表示。这意味着：

- `BMP` 中的字符占用一个 `char`（16 位）。
- 补充字符占用两个 `char`，即一个代理对。

例如：

```java
String str = "Hello";
```

在内存中，`str` 会被表示为一个 `String` 对象，它内部持有一个 `char[]` 数组，内容是：

```console
{'H', 'e', 'l', 'l', 'o'}
```

这些字符（'H', 'e', 'l', 'l', 'o'）在 UTF-16 编码中是 2 字节的，即每个字符占用 16 位。

>在Java 9之前，String内部使用char[]数组来存储字符。从Java 9开始，为了节省空间，如果字符串只包含Latin-1字符（即ASCII字符的扩展），则使用byte[]数组存储，并使用一个encoding-flag来标识编码方式。

再例如，上文提到字符 `U+1F600`（笑脸表情😀），无法用两字节表示，需要用代理对表示，其 `UTF-16` 编码为 **`0xD80F 0xDE00`**。在Java程序中，会有以下情况出现：当判断字符串长度时，`str.length()` 方法将返回 值会比你看到的字符多，因为代理对被计为两个字符。

```java
package com.coderli.one.jdk.common;

public class StringCodeDemo {
    public static void main(String[] args) {
        String str = "Hello😀";

        // 获取字符串长度
        System.out.println("字符串的长度（字符数）：" + str.length()); // 7

        // 使用 codePointAt 来处理完整字符
        System.out.println("字符 '😀' 的 Unicode 码点：" + Integer.toHexString(str.codePointAt(5)).toUpperCase());
        System.out.println("字符 '😀' 的 Unicode 码点：" + str.codePointAt(5)); // 128512 (U+1F600)

        // 遍历字符串中的每个字符（注意代理对会被分开）
        for (int i = 0; i < str.length(); i++) {
            char c = str.charAt(i);
            System.out.println("字符 " + c + " 的编码是：" + (int)c);
        }

        // 使用 codePointAt 获取完整的Unicode码点
        for (int i = 0; i < str.length(); ) {
            int codePoint = str.codePointAt(i);
            System.out.println("Unicode 码点: " + codePoint); // 会显示 U+1F600
            i += Character.charCount(codePoint); // 处理代理对
        }
    }
}
```

输出为

```console
字符串的长度（字符数）：7
字符 '😀' 的 Unicode 码点：1F600
字符 '😀' 的 Unicode 码点：128512
字符 H 的编码是：72
字符 e 的编码是：101
字符 l 的编码是：108
字符 l 的编码是：108
字符 o 的编码是：111
字符 ? 的编码是：55357
字符 ? 的编码是：56832
Unicode 码点: 72
Unicode 码点: 101
Unicode 码点: 108
Unicode 码点: 108
Unicode 码点: 111
Unicode 码点: 128512
```

#### **2. 代理对字符如何识别**

在 Java 中，程序如何知道哪些字符是代理对（**surrogate pairs**），哪些不是，主要依赖于 **Unicode 编码范围** 和 **UTF-16 编码的规范**。

在 UTF-16 中，每个字符的存储单元（`char` 类型）是 16 位的，因此它的值范围从 `0x0000` 到 `0xFFFF`。然而，并不是所有在这个范围内的字符都是有效的字符。UTF-16 将这个 16 位的范围划分为两部分：

- **高位代理**：这些字符的 Unicode 值位于 `0xD800` 到 `0xDBFF` 之间。这些字符并不表示有效的 Unicode 字符，而是作为代理对的一部分，用于表示 Unicode 扩展字符。
  
- **低位代理**：这些字符的 Unicode 值位于 `0xDC00` 到 `0xDFFF` 之间，同样不表示有效字符，而是作为代理对的另一部分，与高位代理一起表示一个完整的字符。

任何 `char` 值位于这两个范围内的字符，都被视为 **代理对的一部分**。如果一个字符的值在这些范围之外（即大于 `0xDFFF` 或小于 `0xD800`），则它是一个有效的 Unicode 字符，不属于代理对。

例如，在 Java 中，可以使用以下代码来判断一个字符是否是高位代理或低位代理：

```java
package com.coderli.one.jdk.common;

public class SurrogateCheckerDemo {
    public static boolean isHighSurrogate(char ch) {
        return ch >= 0xD800 && ch <= 0xDBFF; // 高位代理的范围
    }

    public static boolean isLowSurrogate(char ch) {
        return ch >= 0xDC00 && ch <= 0xDFFF; // 低位代理的范围
    }

    public static void main(String[] args) {
        char highSurrogate = 0xD83D; // 表情符号的高位代理
        char lowSurrogate = 0xDE00;  // 表情符号的低位代理
        char normalChar = 'A';       // 普通字符
        
        System.out.println("High Surrogate: " + isHighSurrogate(highSurrogate));  // true
        System.out.println("Low Surrogate: " + isLowSurrogate(lowSurrogate));    // true
        System.out.println("Normal Char: " + isHighSurrogate(normalChar));       // false
    }
}
```

输出

```console
High Surrogate: true
Low Surrogate: true
Normal Char: false
```

#### **3. 如何还原代理对**

为了从代理对中恢复出完整的 Unicode 字符，程序需要将高位代理和低位代理组合在一起。还原过程的步骤如下：

1. **从高位代理和低位代理恢复原始 Unicode 值**：
   - 给定高位代理 `high` 和低位代理 `low`，原始 Unicode 字符的值可以通过以下公式计算：
   \[
   Unicode = 0x10000 + ((high - 0xD800) << 10) + (low - 0xDC00)
   \]

   这个公式首先将 `0x10000` 加上高位和低位代理中的 10 位数据，其中：
   - `(high - 0xD800)` 取高位代理的偏移量（从 0 到 0x3FF）。
   - `(low - 0xDC00)` 取低位代理的偏移量（从 0 到 0x3FF）。
   - 通过左移 10 位将高位和低位拼接起来，得到完整的 20 位 Unicode 编码。

2. **将 Unicode 值转换为字符**：可以将这个 20 位的 Unicode 值映射回标准的字符。

假设我们有两个 `char`，分别是高位代理和低位代理，我们可以使用下面的代码来恢复原始的 Unicode 字符。

```java
package com.coderli.one.jdk.common;

public class SurrogatePairDecoderDemo {

    // 将代理对还原为原始 Unicode 字符
    public static char[] decodeSurrogatePair(char high, char low) {
        // 检查是否为代理对
        if (!isHighSurrogate(high) || !isLowSurrogate(low)) {
            throw new IllegalArgumentException("Invalid surrogate pair.");
        }

        // 根据公式计算 Unicode 字符
        int unicodeValue = 0x10000 + ((high - 0xD800) << 10) + (low - 0xDC00);
        char[] decodedChars = Character.toChars(unicodeValue);  // 转换成字符
        return decodedChars;
    }

    // 判断高位代理
    public static boolean isHighSurrogate(char ch) {
        return ch >= 0xD800 && ch <= 0xDBFF;
    }

    // 判断低位代理
    public static boolean isLowSurrogate(char ch) {
        return ch >= 0xDC00 && ch <= 0xDFFF;
    }

    public static void main(String[] args) {
        char highSurrogate = 0xD83D; // 表情符号的高位代理
        char lowSurrogate = 0xDE00;  // 表情符号的低位代理
        
        char[] result = decodeSurrogatePair(highSurrogate, lowSurrogate);
        System.out.println("Decoded Character: " + new String(result));  // 输出 "😊"
    }
}
```

输出

```console
Decoded Character: 😀
```

### **（三）总结**

- **UTF-16 编码**：Java 中的 `String` 使用 UTF-16 编码表示字符。UTF-16 使用 2 字节表示大部分常用字符，而对不在基本多语言平面（BMP）内的字符，UTF-16 使用 **代理对**（surrogate pair）表示，这两个 `char` 单元共同组成一个字符。
- **代理对机制**：代理对由 **高位代理** 和 **低位代理** 两个 `char` 组成，用于表示那些超出 BMP 范围的字符。这样，UTF-16 能够表示 Unicode 中的所有字符。

Java 的 `String` 类通过 UTF-16 编码和代理对机制，实现了对广泛字符集的支持，既能高效处理常用字符，又能表示扩展字符如表情符号等。

---

所有代码已上传至：[***https://github.com/lihongzheshuai/java-all-in-one***](https://github.com/lihongzheshuai/java-all-in-one)
