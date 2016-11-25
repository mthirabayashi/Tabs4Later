import $ from 'jquery';

$( document ).ready( () => {
    console.log( "ready!" );
    chrome.tabs.query({}, (tabs) => {
      console.log(tabs);
      const openTabs = tabs;
      openTabs.forEach( tab => {
        $('.open-tabs').append(`<li class=single-open-tab>${tab.title}</li>`)
        console.log(tab.title);
      });
      console.log('got tabs');
    });
    // chrome.tabs.create({url: 'http://www.google.com', active: true});
});
