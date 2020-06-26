function makeBookmarksArray() {
    return [
      {
        id: 1,
        title: 'Bookmark one',
        description: 'This is bookmark one',
        url: "https://bookmarkone.com",
        rating: '5'
        
      },
      {
        id: 2,
        title: 'Bookmark Two',
        description: 'This is bookmark Two',
        url: "https://bookmarktwo.com",
        rating: '4'
        
      },
      {
        id: 3,
        title: 'Bookmark Three',
        description: 'This is bookmark three',
        url: "https://bookmarkthree.com",
        rating: '3'
       
      },
      {
        id: 4,
        title: 'Bookmark Four',
        description: 'This is bookmark four',
        url: "https://bookmarkfour.com",
        rating: '5'
       
      },
    ];
  }

  module.exports = {
      makeBookmarksArray,
  }