define(
[
  "rere/ui/elements/Container", 
  "rere/ui/elements/FragmentElement", 
  "rere/ui/elements/ListElement", 
  "rere/ui/elements/MaybeElement", 
  "rere/ui/elements/ObservableListElement", 
  "rere/ui/elements/RvElement", 
  "rere/ui/elements/renderer"], 
function(
  Container, 
  FragmentElement, 
  ListElement, 
  MaybeElement, 
  ObservableListElement, 
  RvElement, 
  renderer) {
return function(rere) {

return {
    Container: Container(rere), 
    FragmentElement: FragmentElement(rere), 
    ListElement: ListElement(rere), 
    MaybeElement: MaybeElement(rere), 
    ObservableListElement: ObservableListElement(rere), 
    RvElement: RvElement(rere), 
    renderer: renderer(rere)
};

};
});
