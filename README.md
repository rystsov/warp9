# Rerejs

> This library is under heavy development, so do not try to use it, after next commit
> you code will be broken

Yes, this is yet another reactive js-library for builing dynamic applications.
It is similar to AngularJS, KnockoutJS and React (and many others) by tasks it solves.
The key difference is in an approach.

### Templates doesn't fit modern high interactive web apps
At first I should mention that I strongy against to web template systems as a foundation 
for complex web applications. Templates are fine for a content based sites (like blogs, 
wiki, shops and etc.) but lack in case of a interactive one. The main idea beside templates 
is separation of concerns (splitting business logic and presentation logic apart), which 
breaks an appilcation into two parts. That works great until:
 * you appication is large enough so some part of any partitioning into two parts (business 
 and presentation logic) is large enough too
 * you have complex presentation logic and you end with templates, presentation code behide 
 and business logic

To beat the first point you can use a divide and conquer approach (if a templating language 
is sophisticated). But if you face large and interactive template based app you are in 
trouble. Templates and its code behide are tightly coupled, so almost any edits to templates 
should be done simultaneously with edits to code behind. That fact makes impossible to use 
divide and conquer approach and that fact also kills an idea of extracting some interface 
solution to a reusable component since it is an infinitely harder to distribute two files (
template and code behide) compared to one.

**My main point is that separation of concerns (templates) reduces complexity linearity 
by a factor of 2, but divide and conquer does it logarithmic.** So we should develop a 
library with divide and conquer in mind.

### Alternative
I blame templates in the last section, but what is the alternative? Lets see to templates from 
bird's-eye view. 
> It is a map defined in a special language from a model to a view. 

Since we talk about complex web app and there is always a code behind that is highly coupled with a template. 
And if we already have a lot of code related to GUI, what is forces us to use a special language for templates? 
Lets embed "templates" into the host language (javascript) and use its natural way of composition (function 
composition or object delegation) for the divide and conquer approach. Programming gui in code isn't nonsense, 
it is used in [Hiccup](https://github.com/weavejester/hiccup), [React](http://facebook.github.io/react/) libraries 
when we speak about web and almost in all libraries when we speak about desktop.

I prefer function composition over object delegation, so such code in angularjs:

    AngularJS code

could be rewritten in rere.js as

    rere.js code

So we cut off unnecessary entity (special language for templates) and got a way for building composable ui.

### Existsing solutions
#### AngularJS
#### KnockoutJS
#### React
