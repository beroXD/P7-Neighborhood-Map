// Gloubal Variables.
var map;
var markers = [];

// style from `snazzymaps.com/style/17/bright-and-bubbly`
var styles = [
	{
		featureType: 'water',
		stylers: [
			{
				color: '#19a0d8'
				}
            ]
          }, {
		featureType: 'administrative',
		elementType: 'labels.text.stroke',
		stylers: [
			{
				color: '#ffffff'
				},
			{
				weight: 6
				}
            ]
          }, {
		featureType: 'administrative',
		elementType: 'labels.text.fill',
		stylers: [
			{
				color: '#e85113'
				}
            ]
          }, {
		featureType: 'road.highway',
		elementType: 'geometry.stroke',
		stylers: [
			{
				color: '#efe9e4'
				},
			{
				lightness: -40
				}
            ]
          }, {
		featureType: 'transit.station',
		stylers: [
			{
				weight: 9
				},
			{
				hue: '#e85113'
				}
            ]
          }, {
		featureType: 'road.highway',
		elementType: 'labels.icon',
		stylers: [
			{
				visibility: 'off'
				}
            ]
          }, {
		featureType: 'water',
		elementType: 'labels.text.stroke',
		stylers: [
			{
				lightness: 100
				}
            ]
          }, {
		featureType: 'water',
		elementType: 'labels.text.fill',
		stylers: [
			{
				lightness: -100
				}
            ]
          }, {
		featureType: 'poi',
		elementType: 'geometry',
		stylers: [
			{
				visibility: 'on'
				},
			{
				color: '#f0e4d3'
				}
            ]
          }, {
		featureType: 'road.highway',
		elementType: 'geometry.fill',
		stylers: [
			{
				color: '#efe9e4'
				},
			{
				lightness: -25
				}
            ]
          }
        ];

// Locations Array.
var locations = [
	{
		title: 'The Dubai Mall',
		location: {
			lat: 25.198518,
			lng: 55.279619
		},
		venueID: 'b0587f3f964a520cfa822e3',
		category: 'Shopping'
	},
	{
		title: 'Burj Khalifa',
		location: {
			lat: 25.197515,
			lng: 55.274873
		},
		venueID: '4b94f4f8f964a5204b8934e3',
		category: 'Landmark'
	},
	{
		title: 'Jumeirah Beach',
		location: {
			lat: 25.193957,
			lng: 55.231618
		},
		venueID: '4e69bde418a83989ec28ec99',
		category: 'Beach'
	},
	{
		title: 'City Walk',
		location: {
			lat: 25.207714,
			lng: 55.262375
		},
		venueID: 'acfb498e429bde00775b',
		category: 'Shopping'
	},
	{
		title: 'Rolex Tower',
		location: {
			lat: 25.210921,
			lng: 55.275435
		},
	},
	{
		title: 'Ladurée',
		location: {
			lat: 25.197199,
			lng: 55.278637
		},
		venueID: 'cb8a2ecc7228cfa79190ace',
		category: 'Food'
	}
];

function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		center: {
			// Dubi
			lat: 25.2048,
			lng: 55.2708
		},
		zoom: 13,
		styles: styles,
		mapTypeControl: false
	});
	ko.applyBindings(new AppViewModel());
}

var AppViewModel = function () {
	var self = this;
	// Search filter.
	self.filter = ko.observable('');
	self.locationitems = ko.observableArray(locations);
	self.search = ko.computed(function () {
		if (!self.filter().toLowerCase()) {
			// loop through list and make markers appear when search box is cleared.
			self.locationitems().forEach(function (list) {
				if (list.marker) {
					list.marker.setVisible(true);
				}
			});

			return self.locationitems();
		} else {
			// `ko.utils.arrayFilter` return true only when the item’s name starts with the value of the filter observable.
			// `http://www.knockmeout.net/2011/04/utility-functions-in-knockoutjs.html`
			return ko.utils.arrayFilter(self.locationitems(), function (listItem) {
				var keyword = listItem.title.toLowerCase().indexOf(self.filter().toLowerCase()) !== -1;
				if (keyword) {
					listItem.marker.setVisible(true);
				} else {
					listItem.marker.setVisible(false);
				}
				return keyword;
			});
		}
	}, self);

	// marker trigger when item on list is clicked.
	self.trigger = function (place) {
		google.maps.event.trigger(place.marker, 'click');
	};

	// icon color change.
	var defaultIcon = makeMarkerIcon('0091ff');
	var highlightedIcon = makeMarkerIcon('FFFF24');

	// load markers.
	for (var i = 0; i < locations.length; i++) {
		var title = locations[i].title;
		var position = locations[i].location;
		wikipedia(locations[i]);
		var marker = new google.maps.Marker({
			position: position,
			map: map,
			title: title,
			animation: google.maps.Animation.DROP,
			icon: defaultIcon,
			id: i
		});
		markers.push(marker);
		locations[i].marker = marker;
		marker.addListener('click', toggleBounce);

		// change icon color when hover.
		marker.addListener('mouseover', function () {
			this.setIcon(highlightedIcon);
		});
		marker.addListener('mouseout', function () {
			this.setIcon(defaultIcon);
		});

		// load infowindow and content.
		var infowindow = new google.maps.InfoWindow({
			content: title,
			position: position
		});

		// Street View API.
		var streetViewService = new google.maps.StreetViewService();
		var radius = 50;

		function getStreetView(data, status) {

			if (status == google.maps.StreetViewStatus.OK) {
				var nearStreet = data.location.latLng;
				var heading = google.maps.geometry.spherical.computeHeading(nearStreet, marker.position);
				var panoramaOptions = {
					position: nearStreet,
					pov: {
						heading: heading,
						pitch: 30
					}
				};
				var panorama = new google.maps.StreetViewPanorama(
					document.getElementById('pano'), panoramaOptions);
			} else {
				infowindow.setContent('<div>No Street View Found</div>');
			}
		}

		// wikipedia API
		function wikipedia(window) {
			var wikiUrl = 'https://en.wikipedia.org/w/api.php?' +
				'action=opensearch&search=' + title +
				'&format=json&callback=wikiCallback';

			$.ajax({
				url: wikiUrl,
				dataType: "jsonp"
			}).done(function (response) {
				var url = response[3][0];
				window.url = url;
			}).fail(function () {
				// error handling is not build in jsonp
				var wikiFail = setTimeout(function () {
					alert("Failed to load wikipedia link");
				}, 8000);
			});
		}

		// Infowindow Content.
		marker.addListener('click', (function (marker, window) {
			return function () {
				streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);

				if (infowindow.marker) {
					infowindow.marker.setIcon(defaultIcon);
				}
				infowindow.marker = marker;
				infowindow.open(map, marker);
				infowindow.setContent("<div class='title'>" + marker.title + "</div><div><a href=" + window.url + ">" + window.url + "</a></div><hr><div id='pano'></div>");
				this.setIcon(highlightedIcon);
			};
		})(marker, locations[i]));
	}
};

// marker bounce function
function toggleBounce() {
	var self = this;
	self.setAnimation(google.maps.Animation.BOUNCE);
	setTimeout(function () {
		self.setAnimation(null);
	}, 960);
}

function makeMarkerIcon(markerColor) {
	var markerImage = new google.maps.MarkerImage(
		'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
		'|40|_|%E2%80%A2',
		new google.maps.Size(21, 34),
		new google.maps.Point(0, 0),
		new google.maps.Point(10, 34),
		new google.maps.Size(21, 34));
	return markerImage;
}

// functions for opening and closing nav menu.
// from `https://www.w3schools.com/howto/howto_js_sidenav.asp`
function openNav() {
	document.getElementById("mySidenav").style.width = "250px";
	document.getElementById("map").style.marginLeft = "250px";
}

function closeNav() {
	document.getElementById("mySidenav").style.width = "0";
	document.getElementById("map").style.marginLeft = "0";
}

//alert if map is not loading
function googleError() {
	alert("Google map Error, check connection and refresh page.");
}
