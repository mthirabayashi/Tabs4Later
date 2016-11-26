import $ from 'jquery';

const dragOver = (ev) => {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = "none";
    // console.log(ev);
    if (ev.target.attributes.length > 0) {
      if (ev.target.attributes[0].value === 'groupped-tabs') {
        ev.dataTransfer.dropEffect = "copy";
      }
    }
};

const drag = (ev) => {
  // ev.dataTransfer.dropEffect = 'none';
  // ev.dataTransfer.setData("text", ev.target.id);
  // console.log(ev);
  // console.log(ev.target.id);
  // console.log(ev.target.innerText);
  ev.dataTransfer.setData("item-id", ev.target.id);
  ev.dataTransfer.setData("item-url", ev.target.attributes[4].value);
  // console.log(ev.target.children[1].innerHTML);
  ev.dataTransfer.setData("item-title", ev.target.children[1].innerText);
  // console.log(ev.dataTransfer);
  // ev.dataTransfer.effectAllowed = "none";
  // ev.dataTransfer.dropEffect = "none";
  // console.log(ev.dataTransfer);
  // $('single-groupped-tab').addClass('no-drop-zone');
};

const drop = (ev) => {
  ev.preventDefault();
  console.log(ev);
  // ev.dataTransfer.effectAllowed= 'copyMove';
  // ev.dataTransfer.dropEffect= 'move';
  const id = ev.dataTransfer.getData("item-id");
  const url = ev.dataTransfer.getData("item-url");
  const title = ev.dataTransfer.getData("item-title");
  console.log(id);
  console.log(url);
  console.log(title);
  // ev.target.appendChild(document.getElementById(data));
  // console.log(id);
  // console.log(url);
  // console.log(title);

  chrome.storage.sync.get((ob) => {
    let tabs4later = {};
    let allTabs = ob;
    // console.log(allTabs);
    if (allTabs['tabs4later']) {
      allTabs = allTabs.tabs4later;
      const allTabsKeys = Object.keys(allTabs);
      // console.log(allTabsKeys);
      allTabsKeys.forEach(key => {
        // console.log(key);
        // console.log(allTabs[key]);
        tabs4later[key] = {
          id: allTabs[key].id,
          title: allTabs[key].title,
          url: allTabs[key].url
        };
      });
      // console.log(tabs4later);
    }
    tabs4later[url] = {
      id: id,
      title: title,
      url: url
    };
    console.log(tabs4later);
    if (ev.target.className === 'groupped-tabs') {
      // console.log($('#group1').children());
      // const children = $('#group1').toArray();
      const children = Array.prototype.slice.call(ev.target.children);
      console.log(children);
      let included = false;
      children.forEach(child => {
        if (child.attributes[2].value === url){
          included = true;
        }
      });
      if (!included) {
        ev.target.appendChild(document.getElementById(id));
        $(`#${id}`).removeClass('single-open-tab');
        $(`#${id}`).addClass('single-groupped-tab');
      }
      chrome.tabs.remove(parseInt(id));
      chrome.storage.sync.set(
        {
          tabs4later
        }, () => {
          console.log('tab set');
        });
      }
  });
};

$( document ).ready( () => {
    console.log( "ready!" );
    loadOpenTabs();
    loadSavedTabs();
    updateOpenTabs();
    // chrome.tabs.create({url: 'http://www.google.com', active: true});

    $("html").on("dragover", function(event) {
        event.preventDefault();
        event.stopPropagation();
        // $(this).addClass('dragging');
    });

    $("html").on("dragleave", function(event) {
        event.preventDefault();
        event.stopPropagation();
        // $('single-groupped-tab').removeClass('no-drop-zone');
        // $(this).removeClass('dragging');
    });
    $('.single-tab-group').on('drop', () => {
      console.log('dropped!');
      drop(event);
      // chrome.storage.sync.get((ob) => {
      //   console.log(ob);
      // });
    });
    $('html').on('dragover', () => {
      dragOver(event);
    });
});



const loadOpenTabs = () => {
  console.log('load open tabs');
  chrome.tabs.query({}, (tabs) => {
    console.log(tabs);
    // console.log($('.open-tabs'));
    $('.open-tabs').empty();
    $('.open-tabs').off();
    // console.log($('.open-tabs'));
    const openTabs = tabs;
    openTabs.forEach( tab => {
      if (tab.url === "chrome://newtab/") {
        return;
      }
      $('.open-tabs').append(`<li class=single-open-tab grabbable id=${tab.id} draggable=true data-url=${tab.url} data-title=${tab.title}><button class=hidden-remove-open >x</button><div>${tab.title}</div></li>`);
      // remove below line?
      $(`#${tab.id}`).addClass('grabbable');
      // console.log(tab.title);
      // console.log(tab.id);
    });
    $('.single-open-tab').on('dragstart', () => {
      // console.log('dragging!');
      $('single-groupped-tab').addClass('no-drop-zone');
      // console.log($('single-groupped-tab'));
      drag(event);
    });
    $('.hidden-remove-open').click((e) => {
      e.stopPropagation();
      console.log(e);
      console.log(e.target.parentNode.attributes[2].value);
      const id = e.target.parentNode.attributes[2].value;
      chrome.tabs.remove(parseInt(id));
    });
    // console.log('got tabs');
  });
};

const loadSavedTabs = () => {
  console.log('load saved tabs');
  chrome.storage.sync.get(ob => {
    let allSavedTabs = ob;
    $('#group1').empty();
    $( ".single-groupped-tab" ).off();
    // console.log(allSavedTabs);
    // console.log(allSavedTabsKeys);
    // console.log(ob);
    if (allSavedTabs['tabs4later']) {
      allSavedTabs = allSavedTabs.tabs4later;
      const allSavedTabsKeys = Object.keys(allSavedTabs);
      // console.log(allSavedTabsKeys);
      allSavedTabsKeys.forEach(key => {
        // console.log(allSavedTabs[key]);
        const id = allSavedTabs[key].id;
        const url = allSavedTabs[key].url;
        const title = allSavedTabs[key].title;
        // console.log(id);
        // console.log(url);
        // console.log(title);
        //put into group ev.target.appendChild(document.getElementById(id));
        // $(`#${id}`).removeClass('single-open-tab');
        // $(`#${id}`).addClass('single-groupped-tab');
        $('#group1').append(`<li class=single-groupped-tab data-id=${id} data-url=${url} data-title=${title}><button class=hidden-remove-saved >x</button><div >${title}</div></li>`);
      });
      $( ".single-groupped-tab" ).click((e) => {
        // console.log(e);
        // console.log( "Handler for .click() called." );
        // console.log(e.target.attributes);
        chrome.tabs.create({url: e.currentTarget.attributes[2].value, active: true});
      });
      $('.single-groupped-tab').on('dragover', () => {
        dragOver(event);
      });
      $('.hidden-remove-saved').click((e) => {
        e.stopPropagation();
        console.log(e);
        console.log(e.target.parentNode.attributes[1].value);
      });
    }
  });
};

const closeOpenTab = (id) => {

};

// const openSavedTab = (url) => {
  // chrome.tabs.create({url: url, active: true});
// };

const updateOpenTabs = () => {
  chrome.tabs.onUpdated.addListener((tabId , info) => {
    console.log(info);
    if (info.status === "complete") {
      // console.log('updated tabs');
      loadOpenTabs();
      loadSavedTabs();
    }
  });
  chrome.tabs.onRemoved.addListener(()=>{
      loadOpenTabs();
      loadSavedTabs();
    })
};
