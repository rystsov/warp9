# Rere.js

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
 * you have complex presentation logic, so you have templates, presentation code behind 
 and business logic
 

To beat the first point you can use a divide and conquer approach (if a templating language 
is sophisticated). But if you face large and interactive template based app you are in 
trouble. Templates and its code behide are tightly coupled, so almost any edits to templates 
should be done simultaneously with edits to code behind. That fact makes impossible to use 
divide and conquer approach and that fact also kills an idea of extracting some interface 
solution to a reusable component since it is an infinitely harder to think about two files (
template and code behide) as one compared to thinking about one as one.

**My main point is that separation of concerns (templates) reduces complexity linearity 
by a factor of 2, but divide and conquer does it logarithmic.** So we should develop a 
library with divide and conquer in mind.

Another weakness of templates that they were disigned as one time transformation, so when an 
output is built it remains static, but when application is moved to client side is not true 
anymore, a ui should react to our actions and should evolve in time.

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

```html
<body>

<script type="text/ng-template"  id="name-component.html">
    <div class="name-component">
        <div>First name: {{name.firstName}}</div>
        <div>Last name: {{name.lastName}}</div>
    </div>
</script>

<div ng-controller="App">
    <div ng-repeat="name in names" ng-include="'name-component.html'"></div>
</div>
</body>

<script type="text/javascript">
    function App($scope) {
        $scope.names = [
            {firstName: "Denis", lastName: "Rystsov"},
            {firstName: "Lisa", lastName: "Kosyachenko"}
        ];
    }
</script>
```

could be rewritten in rere.js as

```html
<body>
<div id="screen" />
</body>

<script type="text/javascript">
    var H = rere.ui.renderer.h;
    
    function NAME(name) {
        return ["div",
            ["div", "First name: " + name.firstName],
            ["div", "Last name: " + name.lastName]
        ];
    }
    
    rere.ui.renderer.render(screen, ["div", H([
        {firstName: "Denis", lastName: "Rystsov"},
        {firstName: "Lisa", lastName: "Kosyachenko"}
    ].map(NAME))]);
</script>
```

So we cut off unnecessary entity (special language for templates) and got a way for building composable ui.

### Reactivity
One of the things left to be beaten is interactivity. Currently we have a model, an function from model to 
view (lets call it template) and a view which is result of a template applied to a model. We want a mechanism 
that keeps in sync a view with a model and when a model changes it will update a view. This mechanism already 
exists in nature is it a [reactive programming](http://en.wikipedia.org/wiki/Reactive_programming). A reactive 
variable is something that can changes in time. Also there is a way for creating a new reactive variable based on 
a parent one and a casual function from value to value, so when the parent reactive variable changes the function 
will be applied to it value and the child reactive variable will be set with a result of the function. That is 
what we want, so we need a way for composing a transformation from reactive model to reactive view. 

Incidentally it can be very easy if you have in mind a transformation from model value to view value. Reactive 
variable is a monad, so we follow a simple rules to convert a casual code into monadic, like
```javascript
// if f is a function between values and we want to change values 
// with reactive variables we should change functional application
var b = f(a);
// to lifting
var b = a.lift(f);

// if we want to apply a 2-arity function (f) on values to two reactive
// variables (a, b) and got a reactive variable we should use binding
var c = a.bind(function(a) {
  return b.bind(function(b){
    return new RVar(f(a,b));
  });
});
```

### Events
Now we have a reactive model, transformation to a reactive view and a reactive view, the only one question left to 
answer is where to put code that alters the model and how to define a event handlers. Event handlers are being 
defined as closures inside a transformation from model to view and the only thing it may do is affect a model. If a
change to model is very small like set a new value to reactive variable it can be done inside closure, if the change 
is big it should call a method on a model.

### Project state and plans
A functional prototype is done, and a sophisticated enough for a 
[todoapp](https://github.com/rystsov/rerejs/blob/master/examples/todomvc/todomvc.html) from [TodoMVC](http://todomvc.com/). 
But there is a lot of work to do before a beta is ready:
 * avoid memory leaks
 * introduce a syntax sugar for nested binds
 * make api cleaner

**Memory leaks** are natural for a pub/sub systems when you don't care about unsubscription. I have an idea of 
algorithm that helps to avoid manual unsubscriptions in the rere.js library, but the explanation deserve an another 
article.

KnockoutJS has a great **syntax sugar** for defining rective variable (two way binding) without nested bind, I should 
introduce it for simple case in rere.js library.

I've written several apps with current version of rere.js, so I know what places in **api must be changed**.
 

### Comparison
#### AngularJS
#### KnockoutJS
#### React
