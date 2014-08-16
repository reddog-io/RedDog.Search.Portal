angular.module('reddog.search', ['ui.bootstrap', 'ngRoute', 'ngCookies', 'cgBusy', 'angularFileUpload', 'fundoo.services'])
    .constant('viewBase', 'views/');

/**
 * Route configuration.
 */
angular.module('reddog.search').config(function ($routeProvider, viewBase) {
    $routeProvider
        .when('/indexes', {
            state: 'indexes',
            controller: 'IndexesCtrl',
            templateUrl: viewBase + 'indexes.html'
        })
        .when('/indexes/new', {
            state: 'index.new',
            controller: 'IndexEditCtrl',
            templateUrl: viewBase + 'indexEdit.html'
        })
        .when('/indexes/edit/:indexName', {
            state: 'index.edit',
            controller: 'IndexEditCtrl',
            templateUrl: viewBase + 'indexEdit.html'
        })
        .when('/indexes/edit/:indexName/scoringProfile', {
            state: 'index.edit',
            controller: 'ScoringProfileEditCtrl',
            templateUrl: viewBase + 'scoringProfileEdit.html'
        })
        .when('/indexes/search/:indexName', {
            state: 'index.search',
            controller: 'IndexSearchCtrl',
            templateUrl: viewBase + 'indexSearch.html'
        })
        .when('/indexes/import/:indexName', {
            state: 'index.import',
            controller: 'IndexImportCtrl',
            templateUrl: viewBase + 'indexImport.html'
        })
        .otherwise({ redirectTo: '/indexes' });
});

/**
 * Master controller which controls the navigation menu.
 */
angular.module('reddog.search').controller('MasterCtrl', function ($rootScope, $scope, $route, $location, $routeParams) {
    $scope.toggle = true;
    $scope.toggleSidebar = function () {
        $scope.toggle = !$scope.toggle;
    };

    $rootScope.$on("$routeChangeSuccess", function ($currentRoute, $previousRoute) {
        $scope.currentAction = $route.current.state;
        $scope.currentPath = '#' + $location.path();
        $scope.currentParams = $route.current.params;
    });
});

/**
 * Indexes overview.
 */
angular.module('reddog.search').controller('IndexesCtrl', function ($scope, $location, modalService, indexService) {
    var self = this;
    self.loadIndexes = function () {
        $scope.loading = true;

        // Load from the service.
        indexService.getIndexes()
            .then(function (indexes) {
                $scope.indexes = indexes;

                // Get stats for each index.
                angular.forEach(indexes, function (index) {
                    indexService.getIndexStatistics(index.name).then(function (stats) {
                        index.stats = stats;
                    });
                });
            })
            .finally(function () {
                $scope.loading = false;
            });
    };

    $scope.selectIndex = function (index) {
        $location.path("/indexes/edit/" + index.name);
    }

    $scope.searchIndex = function (index) {
        $location.path("/indexes/search/" + index.name);
    }

    $scope.importIndex = function (index) {
        $location.path("/indexes/import/" + index.name);
    }

    $scope.deleteIndex = function (index) {
        var modalOptions = {
            closeButtonText: 'Cancel',
            actionButtonText: 'Delete Index',
            headerText: 'Delete ' + index.name + '?',
            bodyText: 'Are you sure you want to delete this index?'
        };

        modalService.showModal({}, modalOptions).then(function (result) {
            if (result === 'ok') {
                $scope.loadingMessage = "Deleting index '" + index.name + "'...";
                $scope.loadingPromise = indexService.deleteIndex(index.name)
                    .then(function () {
                        self.loadIndexes();
                    }, function (data) {
                        $scope.error = data.error;
                    });
            }
        });
    };

    // Load indexes.
    self.loadIndexes();
});

/**
 * Index edit.
 */
angular.module('reddog.search').controller('IndexEditCtrl', function ($scope, $route, $routeParams, $location, $q, indexService, $rootScope) {
    var _this = this;
    $scope.index = { fields: [], scoringProfiles: [] };
    $scope.isNew      = true;
    $scope.fieldTypes = [
        { name: "Edm.String" },
        { name: "Collection(Edm.String)", },
        { name: "Edm.Int32" },
        { name: "Edm.Double" },
        { name: "Edm.Boolean" },
        { name: "Edm.DateTimeOffset" },
        { name: "Edm.GeographyPoint" }
    ];
    $scope.scoringProfileType = [
        { name: "magnitude" },
        { name: "freshness", },
        { name: "distance" }
    ];
    $scope.scoringProfileInterpolations = [
        { name: "constant" },
        { name: "linear", },
        { name: "quadratic" },
        { name: "logarithmic" }
    ];

    // Are we in edit mode?
    if (angular.isDefined($routeParams.indexName)) {
        $scope.isNew = false;

        // Load the index.
        indexService.getIndex($routeParams.indexName)
            .then(function (index) {
                $scope.index = index;
            });
    }

    // Create a new field.
    $scope.newField = function () {
        $scope.index.fields.push({});
    };

    // Delete an existing field.
    $scope.deleteField = function (field) {
        $scope.index.fields.splice($scope.index.fields.indexOf(field), 1);
    };

    // Only allow 1 key field to be selected.
    $scope.fieldKeySelected = function (selectedField) {
        angular.forEach($scope.index.fields, function (field) {
            if (field != selectedField)
                field.key = false;
        });
    };

    // Create a new scoringProfile.
    $scope.newScoringProfile = function () {
        var sp = { name: 'My scoring profile' };
        $scope.index.scoringProfiles.push(sp);
        $scope.editScoringProfile(sp);
    };

    // Edit an existing scoringProfile.
    $scope.editScoringProfile = function (scoringProfile) {
        //createDialog('/views/scoringProfileEdit.html', {
        //    id: 'simpleDialog',
        //    title: 'Edit Scoring Profile',
        //    controller: 'ScoringProfileEditCtrl',
        //    backdrop: true,
        //    success: { label: 'Success', fn: function () { console.log('Simple modal closed'); } }
        //}, { scoringProfile: scoringProfile });
        // Quick hack to pass around the scoring profile.
        $rootScope.scoringProfile = scoringProfile;

        // Open the edit page.
        $location.path("/indexes/edit/" + $scope.index.name + '/scoringProfile');
    };

    // Delete an existing scoringProfile.
    $scope.deleteScoringProfile = function (scoringProfile) {
        $scope.index.scoringProfiles.splice($scope.index.scoringProfiles.indexOf(scoringProfile), 1);
    };

    $scope.save = function () {
        if ($scope.isNew) {
            $scope.loadingMessage = "Creating index '" + $scope.index.name + "'...";
            $scope.loadingPromise = indexService.createIndex($scope.index)
                .then(function() {
                    $location.path("/indexes");
                }, function(data) {
                    $scope.error = data.error;
                });
        } else {
            $scope.loadingMessage = "Updating index '" + $scope.index.name + "'...";
            $scope.loadingPromise = indexService.updateIndex($scope.index)
                .then(function () {
                    $location.path("/indexes");
                }, function (data) {
                    $scope.error = data.error;
                });
        }
    }
});

/**
 * Scoring Profile edit.
 */
angular.module('reddog.search').controller('ScoringProfileEditCtrl', function ($scope, $rootScope) {
    $scope.scoringProfile = $rootScope.scoringProfile;
    $scope.scoringProfileType = [
        { name: "magnitude" },
        { name: "freshness", },
        { name: "distance" }
    ];
    $scope.scoringProfileInterpolations = [
        { name: "constant" },
        { name: "linear", },
        { name: "quadratic" },
        { name: "logarithmic" }
    ];
    $scope.addWeight = function () {
        $scope.scoringProfile.weights.push({});
    };
    $scope.deleteWeight = function (weight) {
        $scope.scoringProfile.weights.splice($scope.scoringProfile.weights.indexOf(weight), 1);
    };
    $scope.addFunction = function () {
        $scope.scoringProfile.functions.push({});
    };
    $scope.deleteFunction = function (weight) {
        $scope.scoringProfile.functions.splice($scope.scoringProfile.functions.indexOf(weight), 1);
    };
});

/**
 * Index import.
 */
angular.module('reddog.search').controller('IndexImportCtrl', function ($scope, $routeParams, $upload) {
    $scope.onFileSelect = function ($files) {
        //$files: an array of files selected, each file has name, size, and type.
        for (var i = 0; i < $files.length; i++) {
            var file = $files[i];
            $scope.upload = $upload.upload({
                url: '/api/import/' + $routeParams.indexName,
                method: 'PUT',
                file: file
            }).success(function (data, status, headers, config) {
                // file is uploaded successfully
                console.log(data);
            });
        }
    };
});

/**
 * Index search.
 */
angular.module('reddog.search').controller('IndexSearchCtrl', function ($scope, $route, $routeParams, $location, $q, indexService) {
    $scope.searchQuery = {
        mode: 'any',
        count: true
    };
    $scope.fields = [ ];
    $scope.modes  = [
        { name: "any" },
        { name: "all" }
    ];
    $scope.search = function () {
        $scope.loading = true;
        $scope.error = null;
        indexService.search($routeParams.indexName, $scope.searchQuery).then(function (data) {
            $scope.results = data.value;

            if (data['@odata.count'] > 0)
                $scope.count = data['@odata.count'];
            else
                $scope.count = 'N/A';

            if (data['@search.facets'] != null)
                $scope.facets = data['@search.facets'];
            else
                $scope.facets = null;

            // Dynamically load the fields.
            $scope.fields = [];
            if ($scope.results.length > 0) {
                angular.forEach($scope.results[0], function (idx, fieldName) {
                    if (!angular.isObject($scope.results[0][fieldName]) || Object.keys($scope.results[0][fieldName]).length > 0)
                        $scope.fields.push(fieldName);
                });
            }
        }, function (data) {
            $scope.error = angular.isDefined(data.error) ? data.error : data;
        }).finally(function() {
            $scope.loading = false;
        });
    };
});

/**
 * Indexes overview.
 */
angular.module('reddog.search').service('indexService', function ($http, $q) {
    this.getIndexes = function () {
        var d = $q.defer();
        $http.get('api/indexes/', { cache: false }).success(function (data) {
            d.resolve(data.body);
        }).error(function (data) {
            d.reject(data);
        });
        return d.promise;
    };
    this.getIndex = function (indexName) {
        var d = $q.defer();
        $http.get('api/indexes/' + indexName, { cache: false }).success(function (data) {
            d.resolve(data.body);
        }).error(function (data) {
            d.reject(data);
        });
        return d.promise;
    };
    this.getIndexStatistics = function (indexName) {
        var d = $q.defer();
        $http.get('api/indexes/' + indexName + "/stats", { cache: false }).success(function (data) {
            d.resolve(data.body);
        }).error(function (data) {
            d.reject(data);
        });
        return d.promise;
    };
    this.createIndex = function (index) {
        var d = $q.defer();
        $http.post('api/indexes', index).success(function (data) {
            d.resolve(data.body);
        }).error(function (data) {
            d.reject(data);
        });
        return d.promise;
    };
    this.updateIndex = function (index) {
        var d = $q.defer();
        $http.put('api/indexes', index).success(function (data) {
            d.resolve(data.body);
        }).error(function (data) {
            d.reject(data);
        });
        return d.promise;
    };
    this.deleteIndex = function (indexName) {
        var d = $q.defer();
        $http.delete('api/indexes/' + indexName).success(function (data) {
            d.resolve(data.body);
        }).error(function (data) {
            d.reject(data);
        });
        return d.promise;
    };
    this.search = function (indexName, query) {
        var d = $q.defer();
        $http.get('api/search/' + indexName, {
            params: query
        }).success(function (data) {
            d.resolve(data.body);
        }).error(function (data) {
            d.reject(data);
        });
        return d.promise;
    };
});

angular.module('reddog.search').service('modalService', function ($modal) {
    var modalDefaults = {
        backdrop: true,
        keyboard: true,
        modalFade: true,
        templateUrl: '/partials/modal.html'
    };

    var modalOptions = {
        closeButtonText: 'Close',
        actionButtonText: 'OK',
        headerText: 'Proceed?',
        bodyText: 'Perform this action?'
    };

    this.showModal = function (customModalDefaults, customModalOptions) {
        if (!customModalDefaults)
            customModalDefaults = {};
        customModalDefaults.backdrop = 'static';
        return this.show(customModalDefaults, customModalOptions);
    };

    this.show = function (customModalDefaults, customModalOptions) {
        //Create temp objects to work with since we're in a singleton service
        var tempModalDefaults = {};
        var tempModalOptions = {};

        //Map angular-ui modal custom defaults to modal defaults defined in this service
        angular.extend(tempModalDefaults, modalDefaults, customModalDefaults);

        //Map modal.html $scope custom properties to defaults defined in this service
        angular.extend(tempModalOptions, modalOptions, customModalOptions);

        if (!tempModalDefaults.controller) {
            tempModalDefaults.controller = function ($scope, $modalInstance) {
                $scope.modalOptions = tempModalOptions;
                $scope.modalOptions.ok = function (result) {
                    $modalInstance.close('ok');
                };
                $scope.modalOptions.close = function (result) {
                    $modalInstance.close('cancel');
                };
            };

            tempModalDefaults.controller.$inject = ['$scope', '$modalInstance'];
        }

        return $modal.open(tempModalDefaults).result;
    };
});

/*
 * Loading directive.
 */
angular.module('reddog.search').directive('loading', function () {
    return {
        restrict: 'AE',
        replace: 'false',
        template: '<div class="loading"><div class="spinner"></div></div>'
    }
});

/*
 * Bytes formatting (size).
 */
angular.module('reddog.search').filter('bytes', function () {
    return function (bytes, precision) {
        if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
        if (typeof precision === 'undefined') precision = 1;
        var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
        number = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) + ' ' + units[number];
    }
});

/*
 * Configure no cache interceptor.
 */
angular.module('reddog.search').config(function ($httpProvider) {
    $httpProvider.interceptors.push('noCacheInterceptor');
}).factory('noCacheInterceptor', function () {
    return {
        request: function (config) {
            var endsWithHtml = config.url.indexOf('.html', this.length - 5) !== -1;
            if (config.method == 'GET' && !endsWithHtml) {
                var separator = config.url.indexOf('?') === -1 ? '?' : '&';
                config.url = config.url + separator + '_t=' + new Date().getTime();
            }
            return config;
        }
    };
});

