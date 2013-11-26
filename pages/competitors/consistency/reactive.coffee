bind = rx.bind
rxt.importTags()

alice = rx.cell(10)
bob = rx.cell(15)
history = rx.array()
snapshot = bind ->
  JSON.stringify {
    Alice: alice.get() + "$",
    Bob: bob.get() + "$",
    sum: (alice.get() + bob.get()) + "$"
  }
snapshot.onSet.sub ([old, val]) ->
  history.push(val)

$ ->
  $('.coffee').prepend(
    div [
      div [
        div {"class": "accounts-title"}, [
          div [ b "Alice's account" ]
          div [ b "Bob's account" ]
        ]
        div {"class": "accounts-value"}, [
          div [ span bind -> [alice.get() + "$"] ]
          div [ span bind -> [bob.get() + "$"] ]
        ]
        div {"class": "clear"}
      ]
      div {"class": "transfer"}, [
        parcel = input {"type": "text", "value": "2"}
        button {
          click: ->
            alice.set(alice.get()-parseInt(parcel.val()))
            bob.set(bob.get()+parseInt(parcel.val()))
        }, "Transfer from Alice to Bob"
      ]
      div {"class": "history"}, [
        div [b "Account history"]
        div {"class": "snapshots"}, history.map (item) ->
          div item
      ]
    ]
  )