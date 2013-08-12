Rerejs
======

Yes, this is yet another reactive js-library for builing dynamic applications.
It is similar to AngularJS, KnockoutJS and React (and many others) by tasks it solves.
The key difference is in an approach.

At first I should mention that I strongy against to web template systems as a foundation 
for complex web applications. Templates are fine for a content based sites (like blogs, 
wiki, shops and etc.) but lack in case of a interactive one. The main idea beside templates 
is separation of concerns (splitting business logic and presentation logic apart), which 
breaks an appilcation into two parts. That works great until:
 * you appication is large enough so some part of each partitioning into two parts (business 
 and presentation logic)  is large enough too
 * you have complex presentation logic and you end with templates, presentation code behide 
 and business logic
