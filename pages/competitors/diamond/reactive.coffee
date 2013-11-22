bind = rx.bind
rxt.importTags()

diamonds = rx.cell(1);

repeatDiamondShape = (seed,n) ->
  if n==0
    seed
  else
    s1 = bind -> seed.get() + 1
    s2 = bind -> seed.get() + 1
    repeatDiamondShape (bind -> s1.get() + s2.get()), n-1

$ ->
  $('.coffee').prepend(
    div [
      label {"for": "diamonds"}, ["Enter number of diamonds:"]
      diamondsInput = input {type: "text", value: "1"}
      button {
        click: ->
          value = parseInt(diamondsInput.val())
          diamonds.set(value)
      }, "Calc updates"
    ]
    span bind ->
      if diamonds.get()>0
        source = rx.cell(1)
        target = repeatDiamondShape(source, diamonds.get())
        updates = 0
        handler = target.onSet.sub ->
          updates += 1
        updates = 0
        source.set(2)
        target.onSet.unsub handler
        "Expected one update, but got " + updates
      else
        "Should be an integer above 0"
  )
