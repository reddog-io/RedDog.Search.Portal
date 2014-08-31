// include Fake lib
#r @"tools/fake/FakeLib.dll"
open Fake
open Fake.AssemblyInfoFile

// Properties
let version = environVarOrDefault "version" "1.0.0.0"
let productDescription = "A management portal for Azure Search"
let buildDir = "./build/"
let packagingDir = "./packaging/"

// Cleanup the output folders
Target "Clean" (fun _ ->
    CleanDir buildDir
)

Target "BuildApp" (fun _ ->
    // Generate assembly info.
    CreateCSharpAssemblyInfo "./src/RedDog.Search.Portal/Properties/AssemblyInfo.cs"
        [Attribute.Title "RedDog.Search.Portal"
         Attribute.Description productDescription
         Attribute.Product "RedDog.Search.Portal"
         Attribute.Version version
         Attribute.FileVersion version]

    // Rebuild the application.
    let rebuildOptions defaults = 
            { defaults with
                    Targets = ["Rebuild"]
                    Properties = 
                        [
                            "Optimize", "True"
                            "Configuration", "Release"
                        ]
            }
    build rebuildOptions "./src/RedDog.Search.Portal/RedDog.Search.Portal.csproj" 
    
    // Options for when we will be publishing the application.
    let publishOptions defaults = 
            { defaults with
                    Targets = ["ResolveReferences;_WPPCopyWebApplication"]
                    Properties = 
                        [
                            "Configuration", "Release"
                            "OutputPath", "..\\..\\build\\output\\bin"
                            "WebProjectOutputDir", "..\\..\\build\\output"
                        ]
            }
    build publishOptions "./src/RedDog.Search.Portal/RedDog.Search.Portal.csproj" 
)

Target "Package" (fun _ ->
    let author = 
                [
                    "Sandrino Di Mattia"
                    "Toon De Coninck"
                ]
    
    CopyFile (buildDir @@ "output") (packagingDir @@ "applicationHost.xdt")
    
    // Package RedDog.Search.Portal
    NuGet (fun p ->
        {p with
            Authors = author
            Project = "search-portal"
            Title = "RedDog Search Portal"
            Description = productDescription
            OutputPath = buildDir
            Summary = productDescription
            WorkingDir = "."
            Version = version }) (packagingDir @@ "RedDog.Search.Portal.nuspec")
)
    
// Default target
Target "Default" (fun _ ->
    let msg = "Building RedDog Search Portal version: " + version
    trace msg
)

// Dependencies
"Clean"
   ==> "BuildApp"
   ==> "Package"
   ==> "Default"
  
// Start Build
RunTargetOrDefault "Default"