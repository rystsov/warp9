bind = rx.bind
rxt.importTags()

adds = 0
handlers = rx.cell(0)
driver = rx.cell(0)
items = rx.array()

clear = (list) ->
  while list.raw().length!=0
    list.remove(list.raw()[0])

$ ->
  $('.coffee').prepend(
    div [
      div bind -> ["Number of subscriptions to 'driver': #{handlers.get()}"]
      div [
        button {
          click: ->
            driver.set(driver.get()+1)
            handlers.set(driver.onSet.subs.length)
        }, "inc"
        button {
          click: ->
            offset = adds++
            item = bind -> driver.get() + offset
            items.push(item)
            handlers.set(driver.onSet.subs.length)
        }, "add"
        button {
          click: ->
            clear(items)
            handlers.set(driver.onSet.subs.length)
        }, "clear"
        div items.map (item) ->
          div bind -> ["#{item.get()}"]
      ]
    ]
  )