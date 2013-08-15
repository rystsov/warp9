define(
[
  "rere/ui/elements/Container",
  "rere/ui/elements/ListElement",
  "rere/ui/elements/RvElement"],
function(
  Container,
  ListElement, 
  RvElement) {
return function(rere) {

return {
    Container: Container(rere), 
    ListElement: ListElement(rere),
    RvElement: RvElement(rere)
};

};
});
