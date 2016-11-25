import $ from 'jquery';

const allowDrop = (ev) => {
    ev.preventDefault();
};

const drag = (ev) => {
    // ev.dataTransfer.setData("text", ev.target.id);
    console.log(ev);
    // console.log(ev.target.innerText);
    ev.dataTransfer.setData("text", ev.target.id);
    // console.log(ev.dataTransfer);
};

const drop = (ev) => {
    ev.preventDefault();
    console.log(ev);
    const data = ev.dataTransfer.getData("text");
    // ev.target.appendChild(document.getElementById(data));
    console.log(data);
    // var data = ev.dataTransfer.getData("text");
    // $('.single-tab-group').append(`<li class=single-groupped-tab>${document.getElementById(data)}</li>`);
    if (ev.target.className === 'groupped-tabs') {
      ev.target.appendChild(document.getElementById(data));
      $(`#${data}`).removeClass('single-open-tab');
      $(`#${data}`).addClass('single-groupped-tab');
    }
};

$( document ).ready( () => {
    console.log( "ready!" );
    chrome.tabs.query({}, (tabs) => {
      console.log(tabs);
      const openTabs = tabs;
      openTabs.forEach( tab => {
        $('.open-tabs').append(`<li class=single-open-tab draggable=true id=tab${tab.id}>${tab.title}</li>`);
        // console.log(tab.title);
        // console.log(tab.id);
      });
      $('.single-open-tab').on('dragstart', () => {
        console.log('dragging!');
        drag(event);
      });
      $("html").on("dragover", function(event) {
          event.preventDefault();
          event.stopPropagation();
          $(this).addClass('dragging');
      });

      $("html").on("dragleave", function(event) {
          event.preventDefault();
          event.stopPropagation();
          $(this).removeClass('dragging');
      });
      $('.single-tab-group').on('drop', () => {
        console.log('dropped!');
        drop(event);
      });
      console.log('got tabs');
    });
    // chrome.tabs.create({url: 'http://www.google.com', active: true});
});
