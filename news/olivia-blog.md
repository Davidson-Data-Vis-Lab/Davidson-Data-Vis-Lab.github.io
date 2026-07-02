layout: blog
title:  JITVis Summer Research: Creating the Dual View
date:   2024-06-05 15:44:50 -0400
permalink: /news/template
---

#### by [Olivia Burls](/people#olivia-burls-28-github)

While compilers are incredibly useful, debugging them is extremely difficult and requires parsing through thousands of lines of code and trace output. Developers use these compilers to help run web browsers like Google Chrome. So you can see how important a working compiler is. Developers look at graph phases over time (produced by the compiler) and compare them. While tools like Google V8’s Turbolizer or Firefox Spidermonkey’s iongraph help visualize these graphs, they require additional work from the developers. This summer, I began working on this existing research to continue to build a solution. In this work, we created a multi-view visualization tool that allows developers to compare two phases at once and gives them an overview to potentially help spot buggy code faster.

### What Are We Actually Tackling?
In short, compilers translate human code (a JavaScript file) into machine code (code the computer understands) so it can perform the tasks. An Ahead-of-time compiler runs before the program executes. JIT compilers, or Just-In-Time compilers, perform optimizations while the program runs. This type of compiler is often seen in web browsers like Google’s search engine. Compilers produce an Intermediate Representation (IR) that developers use to debug their code. Each IR is an optimization phase that the compiler produces as it gets closer to the machine code, think of this as an intermediate step between human code and machine code. These IR’s are often visualized in a Sea-of-Nodes or Control Flow Graph (CFG) layout, and the compiler can produce multiple phases.

![SoN and CFG graph layout](./images/olivia-blog-images/SoN-CFG.png)
*SoN (left) and CFG (right) graph layout*

A single IR phase can be difficult to parse because developers have to comb through thousands of lines of a JSON file, a data structure that holds all relevant optimization information. This is where tools such as Google V8’s Turbolizer and Firefox’s iongraph come into play. They visualize these IR phases in its respective layout (SoN or CFG), providing developers with a tool to examine nodes or blocks that typically hold the bug. Developers usually load a JSON(s) into the tool and split their screen so they can see two consecutive phases side by side to track any node or block changes. Developers split their screen because it allows them to look at how optimization phases change overtime. They also review the raw text that is in a JSON file.

![The length a JSON file could have](./images/olivia-blog-images/sample-JSON.png)
*An example of how long a JSON file could be*

Noting how all current tools do not have support for phase-by-phase or file-by-file comparison (eliminating the need to pull up the tool twice and splitting your screen), our goal for the summer was to build a visualization tool that supports the two types of IR graphs (SoN and CFG). Our tool shows phase-by-phase comparison and an overview that allows developers to spot potential “buggy” code, streamlining the entire process.

### Getting Caught Up

Before I could continue any research or even write code, I had to orient myself with the current status of the research. Coming from taking Data Visualization and Computer Organization, I knew vaguely what a compiler was and had some experience in visualizing data into graphs and charts, but it was a learning curve for my first two weeks. Dr. Williams presented me with a poster and poster summary describing the current visualization tool, past papers, and articles detailing a competing tool, [Google V8’s Turbolizer](https://v8.github.io/tools/head/turbolizer/) (and later [Firefox SpiderMonkey’s iongraph](https://github.com/mozilla-spidermonkey/iongraph)). I played around with the tool and spent time understanding the scope of the problem and the compiler data that I was dealing with.  
​
In the beginning stages, Turbolizer was a huge point of reference in the initial development of our tool, and understanding SoN and CFG graph layouts, potential features, and gaps in the tool that we would want to implement. We spent a couple of days just trying to get the tool running. I used AI to generate JavaScript files and worked in the terminal to produce an acceptable JSON that was “hot enough” to run. I noted the output itself, specifically what the layout looked like, what the nodes represented, and eventually mapped some information back to the JSON file to see where everything lived. While I didn’t know this at the time, it was extremely important to understand the JSON structure, as I used that knowledge when developing the tool. Along with understanding the data and Turbolizer, V8 has 7 other tools. Part of our initial research was to also understand these 7 tools and to get an overview of what exists, ensuring our tool was different and tackled new problems.

![Turbolizer tool](./images/olivia-blog-images/turbolizer.png)
*A view of the Turbolizer tool*

On the visualization side, producing a tool that is human-readable, representative of the data, and visually appealing also influenced how we tackled this problem. I did a miniature literature review that mostly focused on these visualization concepts. I researched graph drawing, incorporating interactivity effectively, and graph comparison. This research affirmed a lot of the initial design ideas we had, like a side-by-side view and linked interactions between each view. It also stressed the idea of preserving the user's mental map of what the graphs look like. This means that when viewing an IR graph from phase to phase, nodes or blocks should not be changing their position drastically. This information would be especially useful when I tackled the layout algorithms.

### Designing our Vis Tool

Kwasi and I took some time to sketch out the 3 different views we wanted and received feedback. Our tool, JITVis, visualizes each IR phase while adding additional features recommended by Dr. Williams and Dr. Lim. I primarily worked on the dual view that does a phase-by-phase comparison.

#### Heatmap Overview

![Heatmap overview sketch](./images/olivia-blog-images/view1.png)
*A sketch of the heatmap overview*

This view organizes a table into phases (columns) and JSON files (rows) and colors each cell based on how “buggy” the phase could be.

#### Dual View

![Dual View Sketch](./images/olivia-blog-images/view2.png)
*A sketch of the dual view*

This view allows you to view two phases side by side and gives a phase and node summary.

#### Small Multiples

![Small Multiples Sketch](./images/olivia-blog-images/view3.png)
*A sketch of the small multiples view*

This view would show miniature versions of the outlines of each graph so developers can look at structural changes.

### Creating the Dual View

Before I began coding, I researched some layouts specifically for the SoN style, as that was the first graph I tackled. I ended up using a Sugiyama style, which was a decent layout to start with, but quickly became unreadable as the SoN graphs grew larger. Nodes were clustered together or layered on top of each other. These graphs also have a lot of edges, so those were chaotic as well. Once I got a stable graph rendered, I added certain features that were recommended from my talks with Dr. Williams and Dr. Lim, and my notes on the Turbolizer. This included things like a search feature, color-coding the nodes, adding the relevant code, summarizing the entire phase, and adding information about the nodes upon clicking. With that, the first iteration of this view was done!
​
![Old SoN layout](./images/olivia-blog-images/old-SoN.png)
*My first take at SoNs*
​
The next big step was implementing the CFG graphs. This is where I really began to research CFG implementation, specifically Spidermonkey’s iongraph. I looked at an [article](https://spidermonkey.dev/blog/2025/10/28/iongraph-web.html) that explained how the layout worked and gave some pseudocode as well as their GitHub repository containing all the open-source code. Here, I used Claude to help me make sense of the algorithm and implement this specifically in JavaScript because it was written in a different language. I had to change how the data was loaded in because Spidermonkey’s JSON is structurally different from the one I had been using. My biggest problem with this was rendering the edges. There were some floating edges and others that were disconnected. While it did take a day and a half to debug with my professor, the fix was actually pretty simple. I had an issue with actually drawing the edges as opposed to the algorithm not working.
​
![CFG layout](./images/olivia-blog-images/CFG-layout.png)
*The CFG layout*
​
I went back to the SoN phases and refined the layout. I ended up deciding to use a different style. I still used a Sugiyama layout, but I added color and shape to the nodes and edges. This new style is based heavily on a tool called [Seafoam](https://chrisseaton.com/truffleruby/basic-graal-graphs/#:~:text=There%20is%20a%20graph%20of,nodes%20graphical%20IR%20to%20C2), which displays GraalVM's Sea-of-Nodes graphs in an understandable and visually appealing way. It also shortened the edges so there was “less traffic”. Immediately, the first try was better than the old layout, but I still ran into issues such as a missing node and edges for my test case. After more debugging and careful tracing of the JSON data, I figured out that a specific type of node and some mismatched labeling were mainly the cause of the missing node and edges.

![SoN layout](./images/olivia-blog-images/SoN-layout1.png)
*The SoN layout*

### Slight Pause -> Poster and Poster Summary

In the midst of designing the prototype, we all worked on creating a poster and a complementary poster summary to be submitted to IEEE Vis, which is a Data Visualization conference. It was really valuable to pause coding and summarize all the information we had been working on. This taught me how to explain the project and gave me practice writing in a professional sense. Through this, we gained extremely valuable insight during a revising meeting with Dr. Lim and his student researcher. They used the tool based on a buggy and a non-buggy test file they gave us. They used the tool exactly as it was intended and more! The new information they took away from the heatmap view affirmed our in-progress visualization decisions. 

### Final Design!

Our final design includes 2 distinct views. The heatmap is encoded by node and edge changes from phase to phase, aiming to show which phases could hold “buggy” behavior. Our third view from the design process (small multiples) is currently being worked into the heatmap overview. The dual view contains a phase-by-phase comparison and supports both CFG and SoN graph phases. There is linked highlighting between both views, phase and node summaries, and filtering based on edge or node type.

![Heatmap overview](./images/olivia-blog-images/heatmap.png)
*The heatmap view*

![minigraphs](./images/olivia-blog-images/minigraphs.png)
*A sneek-peek into the minigraphs*

![dualView](./images/olivia-blog-images/dualView.png)
*The dual view*

### Reflection

This was genuinely a really enjoyable summer. I loved the slower pace compared to the school year and devoting all my attention to one project. It was definitely overwhelming at first, having to read multiple academic papers, articles, and some code, and truthfully, I didn’t get some concepts until halfway through the project. But, it was really rewarding to learn all of this information and extend some information from previous classes. I think some of my favorite moments were actually just playing with the tool. I also liked changing the colors and could have fun with that before a more acceptable coloring style needed to be implemented.
​
The hardest part for me was definitely figuring out all of the algorithm and layout work for the graphs. It seemed a lot easier than it actually was. You would think the layout looks pretty good, but after trying on a more complex test file, it would look more of a mess. I spent a lot of my later days researching layouts, looking at GitHub repositories, and fighting with AI to make sense of some terms, pseudocode, and code written in a language other than the one I was using. Through this, I did gain a deep understanding of the layouts used and where to pinpoint potential problems in the code. It was constant problem-solving, but extremely satisfying when even the smallest change in the code made noticeable layout differences.
​
I am really grateful to Dr. Williams for trusting me with working on this project and for all her support, expertise, and encouragement this summer. I also really enjoyed my time talking with Dr. Lim, his student researcher, Robby, and Kwasi, as their inputs aided so much in my knowledge and visualization development.
​
I am really proud of all the work I was able to accomplish, and I can't wait to see the newest updates with this tool!


