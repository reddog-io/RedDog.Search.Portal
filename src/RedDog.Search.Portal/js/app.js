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
        .when('/indexes/edit/:indexName/suggester', {
            state: 'index.edit',
            controller: 'SuggesterEditCtrl',
            templateUrl: viewBase + 'suggesterEdit.html'
        })
        .when('/indexes/search/:indexName', {
            state: 'index.search',
            controller: 'IndexSearchCtrl',
            templateUrl: viewBase + 'indexSearch.html'
        })
        .when('/indexes/suggestions/:indexName', {
            state: 'index.suggestions',
            controller: 'IndexSuggestionsCtrl',
            templateUrl: viewBase + 'indexSuggestions.html'
        })
        .when('/indexes/import/:indexName', {
            state: 'index.import',
            controller: 'IndexImportCtrl',
            templateUrl: viewBase + 'indexImport.html'
        })
        .when('/error', {
            state: 'error',
            controller: 'ErrorCtrl',
            templateUrl: viewBase + 'error.html'
        })
        .when('/indexes/lookup/:indexName', {
            state: 'index.lookup',
            controller: 'IndexLookupCtrl',
            templateUrl: viewBase + 'indexLookup.html'
        })
        .otherwise({ redirectTo: '/indexes' });
});

/**
 * Error controller.
 */
angular.module('reddog.search').controller('ErrorCtrl', function ($rootScope, $scope) {
    $scope.lastErrorMessage = $rootScope.lastErrorMessage;
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
        $scope.error = null;

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
            }, function (err) {
                $scope.error = err;
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

    $scope.suggestionsIndex = function (index) {
        $location.path("/indexes/suggestions/" + index.name);
    }

    $scope.importIndex = function (index) {
        $location.path("/indexes/import/" + index.name);
    }

    $scope.lookupIndex = function (index) {
        $location.path("/indexes/lookup/" + index.name);
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

    // Fill combo boxes.
    $scope.fieldTypes = [
        { name: "Edm.String" },
        { name: "Collection(Edm.String)", },
        { name: "Edm.Int32" },
        { name: "Edm.Int64" },
        { name: "Edm.Double" },
        { name: "Edm.Boolean" },
        { name: "Edm.DateTimeOffset" },
        { name: "Edm.GeographyPoint" }
    ];
    $scope.scoringProfileType = [
        { name: "magnitude" },
        { name: "freshness", },
        { name: "distance" },
        { name: "tag" }
    ];
    $scope.scoringProfileInterpolations = [
        { name: "constant" },
        { name: "linear", },
        { name: "quadratic" },
        { name: "logarithmic" }
    ];
    $scope.analyzers = [
        { name: "ar.lucene" },
        { name: "pt-Br.lucene" },
        { name: "zh-Hans.lucene" },
        { name: "zh-Hant.lucene" },
        { name: "cs.lucene" },
        { name: "da.lucene" },
        { name: "nl.lucene" },
        { name: "de.lucene" },
        { name: "el.lucene" },
        { name: "en.lucene" },
        { name: "fi.lucene" },
        { name: "fr.lucene" },
        { name: "hi.lucene" },
        { name: "hu.lucene" },
        { name: "id.lucene" },
        { name: "it.lucene" },
        { name: "ja.lucene" },
        { name: "ko.lucene" },
        { name: "lv.lucene" },
        { name: "no.lucene" },
        { name: "pl.lucene" },
        { name: "pt-Pt.lucene" },
        { name: "ro.lucene" },
        { name: "ru.lucene" },
        { name: "es.lucene" },
        { name: "sv.lucene" },
        { name: "tr.lucene" },
        { name: "th.lucene" },
        { name: "standardasciifolding.lucene" }
    ];

    // Get the current index name.
    var currentIndexName = $routeParams.indexName;

    // Hack: handle return from scoring profile edit page.
    if ($rootScope.currentIndex != null && $rootScope.currentIndex.name == currentIndexName) {
        $scope.isNew = false;
        $scope.index = $rootScope.currentIndex;
    }
    else if (currentIndexName != null) {
        $scope.isNew = false;
        indexService.getIndex(currentIndexName)
            .then(function (index) {
                // Set all the fields readonly
                angular.forEach(index.fields, function (field) {
                    field.isReadOnly = true;
                });

                $scope.index = index;
            });
    }
    else {
        $scope.isNew = true;
        $scope.index = { fields: [], scoringProfiles: [], suggesters: [] };
    }

    // Create a new field.
    $scope.newField = function () {
        $scope.index.fields.push({ retrievable: true, isReadOnly: false });
    };

    // Delete an existing field.
    $scope.deleteField = function (field) {
        if (field.isReadOnly) {
            $scope.index.fields[$scope.index.fields.indexOf(field)] = null;
        } else {
            $scope.index.fields.splice($scope.index.fields.indexOf(field), 1);
        }
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
        var sp = {
            name: 'My scoring profile',
            text: {
                weights: []
            }
        };
        $scope.index.scoringProfiles.push(sp);
        $scope.editScoringProfile(sp);
    };

    // Create a new suggester.
    $scope.newSuggester = function () {
        var suggester = {
            name: '',
            searchMode: 'analyzingInfixMatching',
            sourceField: ''
        };
        $scope.index.suggesters.push(suggester);
        $scope.editSuggester(suggester);
    };

    // Edit an existing scoringProfile.
    $scope.editScoringProfile = function (scoringProfile) {
        // Quick hack to pass around the scoring profile.
        $rootScope.currentIndex = $scope.index;
        $rootScope.currentScoringProfile = scoringProfile;
        // Open the edit page.
        $location.path("/indexes/edit/" + $scope.index.name + '/scoringProfile');
    };

    // Edit an existing suggester.
    $scope.editSuggester = function (suggester) {
        // Quick hack to pass around the scoring profile.
        $rootScope.currentIndex = $scope.index;
        $rootScope.currentSuggester = suggester;
        // Open the edit page.
        $location.path("/indexes/edit/" + $scope.index.name + '/suggester');
    };

    // Delete an existing scoringProfile.
    $scope.deleteScoringProfile = function (scoringProfile) {
        $scope.index.scoringProfiles.splice($scope.index.scoringProfiles.indexOf(scoringProfile), 1);
    };

    $scope.save = function () {
        if ($scope.isNew) {
            $scope.loadingMessage = "Creating index '" + $scope.index.name + "'...";
            $scope.loadingPromise = indexService.createIndex($scope.index)
                .then(function () {
                    // Set all the fields readonly
                    angular.forEach($scope.index.fields, function (field) {
                        field.isReadOnly = true;
                    });

                    $location.path("/indexes");
                }, function (data) {
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
angular.module('reddog.search').controller('ScoringProfileEditCtrl', function ($scope, $rootScope, $route, $routeParams, $location, createDialog) {
    $scope.index = $rootScope.currentIndex;
    $scope.scoringProfile = $rootScope.currentScoringProfile;

    // Redirect to index or homepage if we don't have the current objects.
    if ($scope.index == null || $scope.scoringProfile == null) {
        if (angular.isDefined($routeParams.indexName)) {
            $location.path("/indexes/edit/" + $routeParams.indexName);
            return;
        } else {
            $location.path('/indexes');
            return;
        }
    }

    // Combo.
    $scope.functionAggregationTypes = [
        { name: 'sum' },
        { name: 'average' },
        { name: 'minimum' },
        { name: 'maximum' },
        { name: 'firstMatching' }
    ];

    // Default for function aggregation.
    if ($scope.scoringProfile.functionAggregation == null) {
        $scope.scoringProfile.functionAggregation = 'sum';
    }

    // Manage weights.
    $scope.addWeight = function () {
        $scope.scoringProfile.text.weights.push({});
    };
    $scope.deleteWeight = function (weight) {
        $scope.scoringProfile.text.weights.splice($scope.scoringProfile.text.weights.indexOf(weight), 1);
    };

    // Add a new function with default values.
    $scope.addFunction = function () {
        var func = { type: 'magnitude', interpolation: 'linear' };
        if ($scope.index != null && $scope.index.fields != null && $scope.index.fields.length > 0)
            func.fieldName = $scope.index.fields[0].name;
        if ($scope.scoringProfile.functions == null)
            $scope.scoringProfile.functions = new Array();
        $scope.scoringProfile.functions.push(func);
        $scope.editFunction(func);
    };

    // Show the edit dialog for the function.
    $scope.editFunction = function (func) {
        // Copy the function for editing.
        var editFunc = angular.copy(func);

        // Show the edit dialog.
        createDialog('views/functionEdit.html', {
            id: 'simpleDialog', title: 'Edit Function', controller: 'FunctionEditCtrl', backdrop: true,
            success: {
                label: 'OK', fn: function () {
                    var position = $scope.scoringProfile.functions.indexOf(func);

                    // Remove the original function
                    $scope.deleteFunction(func);

                    // Insert updated function.
                    $scope.scoringProfile.functions.splice(position, 0, editFunc);
                }
            }
        }, { func: editFunc, index: $scope.index });
    };

    // Delete the function from the scoring profile.
    $scope.deleteFunction = function (func) {
        $scope.scoringProfile.functions.splice($scope.scoringProfile.functions.indexOf(func), 1);
    };
});


/**
 * Suggester edit.
 */
angular.module('reddog.search').controller('SuggesterEditCtrl', function ($scope, $rootScope, $route, $routeParams, $location, createDialog) {
    $scope.index = $rootScope.currentIndex;
    $scope.suggester = $rootScope.currentSuggester;

    // Redirect to index or homepage if we don't have the current objects.
    if ($scope.index == null || $scope.suggester == null) {
        if (angular.isDefined($routeParams.indexName)) {
            $location.path("/indexes/edit/" + $routeParams.indexName);
            return;
        } else {
            $location.path('/indexes');
            return;
        }
    }

    // Combo.
    $scope.searchModeTypes = [
        { name: 'analyzingInfixMatching' }
    ];
});

/**
 * Function edit.
 */
angular.module('reddog.search').controller('FunctionEditCtrl', function ($scope, $rootScope, index, func) {
    $scope.index = index;
    $scope.func = func;
    $scope.functionTypes = [
        { name: "magnitude" },
        { name: "freshness", },
        { name: "distance" },
        { name: "tag" }
    ];
    $scope.interpolationTypes = [
        { name: "constant" },
        { name: "linear", },
        { name: "quadratic" },
        { name: "logarithmic" }
    ];
});

/**
 * Index import.
 */
angular.module('reddog.search').controller('IndexImportCtrl', function ($scope, $routeParams, $upload) {
    $scope.onFileSelect = function ($files) {
        $scope.message = null;
        $scope.error = null;

        for (var i = 0; i < $files.length; i++) {
            var file = $files[i];
            $scope.upload = $upload.upload({
                url: 'api/import/' + $routeParams.indexName,
                method: 'PUT',
                file: file
            }).success(function () {
                $scope.message = "The CSV file has been imported. You can now start searching through your data.";
            }).error(function (data) {
                $scope.error = data;
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
        count: true,
        top: 20
    };
    $scope.fields = [];
    $scope.modes = [
        { name: "any" },
        { name: "all" }
    ];

    $scope.searchNextLink = function () {
        $scope.loading = true;
        $scope.error = null;
        indexService.search($routeParams.indexName + '/next', { 'nextlink': $scope.nextLink }).then(function (data) {
            processData(data);
        }, function (data) {
            $scope.error = angular.isDefined(data.error) ? data.error : data;
        }).finally(function () {
            $scope.loading = false;
        });
    }

    $scope.search = function () {
        $scope.loading = true;
        $scope.error = null;
        indexService.search($routeParams.indexName, $scope.searchQuery).then(function (data) {
            processData(data);
        }, function (data) {
            $scope.error = angular.isDefined(data.error) ? data.error : data;
        }).finally(function () {
            $scope.loading = false;
        });
    };

    function processData(data) {
        $scope.results = data.value;

        if (data['@odata.count'] > 0)
            $scope.count = data['@odata.count'];
        else
            $scope.count = 'N/A';

        if (data['@search.facets'] != null)
            $scope.facets = data['@search.facets'];
        else
            $scope.facets = null;

        if (data['@odata.nextLink'] != null)
            $scope.nextLink = data['@odata.nextLink'];
        else
            $scope.nextLink = null;

        // Dynamically load the fields.
        $scope.fields = [];
        if ($scope.results.length > 0) {
            angular.forEach($scope.results[0], function (idx, fieldName) {
                if (!angular.isObject($scope.results[0][fieldName]) || Object.keys($scope.results[0][fieldName]).length > 0)
                    $scope.fields.push(fieldName);
            });
        }
    }
});
/**
 * Index suggestions.
 */
angular.module('reddog.search').controller('IndexSuggestionsCtrl', function ($scope, $route, $routeParams, $location, $q, indexService) {
    $scope.suggestionsQuery = {
        fuzzy: true
    };
    $scope.fields = [];
    $scope.live = false;

    $scope.liveSuggestions = function () {
        if ($scope.live && $scope.suggestionsQuery.search) {
            if ($scope.suggestionsQuery.search.length > 0) {
                $scope.suggestions();
            } else {
                // Clear the results when ther is not search input.
                $scope.results = null;
            }
        }
    }

    $scope.suggestions = function () {
        $scope.loading = $scope.live ? false : true;
        $scope.error = null;
        indexService.suggestions($routeParams.indexName, $scope.suggestionsQuery).then(function (data) {
            $scope.results = data.value;

            // Dynamically load the fields.
            $scope.fields = [];
            if ($scope.results.length > 0) {
                angular.forEach($scope.results[0], function (idx, fieldName) {
                    if (!angular.isObject($scope.results[0][fieldName]) || Object.keys($scope.results[0][fieldName]).length > 0)
                        $scope.fields.push(fieldName);
                });
            }
        }, function (data) {
            // Clear the results on error.
            $scope.results = null;
            $scope.error = angular.isDefined(data.error) ? data.error : data;
        }).finally(function () {
            $scope.loading = false;
        });
    };
});
/**
 * Index Lookup.
 */
angular.module('reddog.search').controller('IndexLookupCtrl', function ($scope, $route, $routeParams, $location, $q, indexService) {
    $scope.lookupQuery = {};
    $scope.fields = [];
    $scope.lookup = function () {
        $scope.loading = true;
        $scope.error = null;
        $scope.result = null;
        indexService.lookup($routeParams.indexName, $scope.lookupQuery).then(function (data) {
            $scope.result = data;

            // Dynamically load the fields.
            $scope.fields = [];

            angular.forEach($scope.result, function (idx, fieldName) {
                if (!angular.isObject($scope.result[fieldName]) || Object.keys($scope.result[fieldName]).length > 0)
                    $scope.fields.push(fieldName);
            });
        }, function (data) {
            $scope.result = null;
            if (angular.isDefined(data)) {
                $scope.error = data;
            }
        }).finally(function () {
            $scope.loading = false;
        });
    };
});
/**
 * Index Service.
 */
angular.module('reddog.search').service('indexService', function ($http, $q) {
    var self = this;

    // Convert the scoring profile weight to an array. This makes it easier to work with ng-repeat.
    this.parseIndexForRead = function (index) {
        if (index.scoringProfiles != null && index.scoringProfiles.length > 0) {
            angular.forEach(index.scoringProfiles, function (sp) {
                if (sp != null && sp.text != null && sp.text.weights != null) {
                    var arr = new Array();
                    for (var i in sp.text.weights) {
                        arr.push({ key: i, value: sp.text.weights[i] });
                    }
                    sp.text.weights = arr;
                }
            });
        }

        if (index.suggesters != null && index.suggesters.length > 0) {
            angular.forEach(index.suggesters, function (suggester) {
                if (suggester && suggester.sourceFields) {
                    suggester.sourceField = suggester.sourceFields.join();
                }
            });
        }

        if (index.corsOptions && index.corsOptions.allowedOrigins) {
            index.corsOptions.allowedOrigins = index.corsOptions.allowedOrigins.join();
        }
        return index;
    };

    // When persisting an index, we need to have the weights as an object.
    this.prepareIndexForWrite = function (index) {
        var idx = angular.copy(index);
        if (idx.scoringProfiles != null && idx.scoringProfiles.length > 0) {
            angular.forEach(idx.scoringProfiles, function (sp) {
                if (sp != null && sp.text != null && sp.text.weights != null && sp.text.weights.length > 0) {
                    var obj = {};
                    for (var i = 0; i < sp.text.weights.length; ++i)
                        obj[sp.text.weights[i].key] = sp.text.weights[i].value;
                    sp.text.weights = obj;
                }

                if (sp != null && sp.text != null && sp.text.weights != null && sp.text.weights.length == 0) {
                    sp.text = null;
                }
            });
        }

        if (idx.suggesters != null && idx.suggesters.length > 0) {
            angular.forEach(idx.suggesters, function (suggester) {

                if (suggester && suggester.sourceField) {
                    if (suggester.sourceField.indexOf(',') >= 0) {
                        suggester.sourceFields = suggester.sourceField.split(',');
                    } else {
                        var sourceFields = [];
                        sourceFields.push(suggester.sourceField);
                        suggester.sourceFields = sourceFields;

                        delete suggester.sourceField;
                    }
                }
            });
        }

        if (idx.corsOptions && idx.corsOptions.allowedOrigins) {
            if (idx.corsOptions.allowedOrigins.indexOf(',') >= 0) {
                idx.corsOptions.allowedOrigins = idx.corsOptions.allowedOrigins.split(',');
            } else {
                var origins = [];
                origins.push(idx.corsOptions.allowedOrigins);
                idx.corsOptions.allowedOrigins = origins;
            }
        }

        return idx;
    };

    // Get a list of indexes.
    this.getIndexes = function () {
        var d = $q.defer();
        $http.get('api/indexes/', { cache: false }).success(function (data) {
            angular.forEach(data.body, function (index) {
                self.parseIndexForRead(index);
            });

            d.resolve(data.body);
        }).error(function (data) {
            d.reject(data);
        });
        return d.promise;
    };

    // Get the details of a specific index.
    this.getIndex = function (indexName) {
        var d = $q.defer();
        $http.get('api/indexes/' + indexName, { cache: false }).success(function (data) {
            self.parseIndexForRead(data.body);
            d.resolve(data.body);
        }).error(function (data) {
            d.reject(data);
        });
        return d.promise;
    };

    // Get the statistics of an index.
    this.getIndexStatistics = function (indexName) {
        var d = $q.defer();
        $http.get('api/indexes/' + indexName + "/stats", { cache: false }).success(function (data) {
            d.resolve(data.body);
        }).error(function (data) {
            d.reject(data);
        });
        return d.promise;
    };

    // Create a new index.
    this.createIndex = function (index) {
        var d = $q.defer();
        $http.post('api/indexes', this.prepareIndexForWrite(index)).success(function (data) {
            d.resolve(data.body);
        }).error(function (data) {
            d.reject(data);
        });
        return d.promise;
    };

    // Update an existing index.
    this.updateIndex = function (index) {
        var d = $q.defer();
        $http.put('api/indexes', this.prepareIndexForWrite(index)).success(function (data) {
            d.resolve(data.body);
        }).error(function (data) {
            d.reject(data);
        });
        return d.promise;
    };

    // Delete an index.
    this.deleteIndex = function (indexName) {
        var d = $q.defer();
        $http.delete('api/indexes/' + indexName).success(function (data) {
            d.resolve(data.body);
        }).error(function (data) {
            d.reject(data);
        });
        return d.promise;
    };

    // Launch a search query.
    this.search = function (indexName, query) {
        var queryCopy = angular.copy(query);
        if (queryCopy.facet) {
            if (queryCopy.facet.indexOf(' ') >= 0) {
                queryCopy.facets = queryCopy.facet.split(' ');
            } else {
                var facets = [];
                facets.push(queryCopy.facet);
                queryCopy.facets = facets;
            }
            delete queryCopy.facet;
        }

        if (queryCopy.scoringParameter) {
            if (queryCopy.scoringParameter.indexOf(' ') >= 0) {
                queryCopy.scoringParameters = queryCopy.scoringParameter.split(' ');
            } else {
                var scoringParameters = [];
                scoringParameters.push(queryCopy.scoringParameter);
                queryCopy.scoringParameters = scoringParameters;
            }
            delete queryCopy.scoringParameter;
        }

        var d = $q.defer();
        $http.get('api/search/' + indexName, {
            params: queryCopy
        }).success(function (data) {
            d.resolve(data.body);
        }).error(function (data) {
            d.reject(data);
        });
        return d.promise;
    };

    // Launch a suggestion query.
    this.suggestions = function (indexName, query) {
        var d = $q.defer();
        $http.get('api/suggestions/' + indexName, {
            params: query
        }).success(function (data) {
            d.resolve(data.body);
        }).error(function (data) {
            d.reject(data);
        });
        return d.promise;
    };

    // Launch a lookup query.
    this.lookup = function (indexName, query) {
        var d = $q.defer();
        $http.get('api/lookup/' + indexName, {
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
        templateUrl: 'partials/modal.html'
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

