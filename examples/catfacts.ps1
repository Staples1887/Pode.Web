Import-Module Pode -MaximumVersion 2.99.99 -Force
Import-Module ..\src\Pode.Web.psm1 -Force

Start-PodeServer {
    # add a simple endpoint
    Add-PodeEndpoint -Address localhost -Port 8090 -Protocol Http
    New-PodeLoggingMethod -Terminal | Enable-PodeErrorLogging

    # set the use of templates, and set a login page
    Use-PodeWebTemplates -Title 'CatFacts' -Theme Dark

    $table = New-PodeWebTable -Name 'Static' -IdentityColumn ID -AsCard -Filter -Sort -Click -Paginate -ScriptBlock {
        # refresh button, to refresh the current row
        $refreshBtn = New-PodeWebButton -Name 'Refresh' -Icon 'refresh-cw' -IconOnly -ScriptBlock {
            $response = (Invoke-RestMethod -Uri 'https://catfact.ninja/facts?limit=1' -Method Get).data.fact

            # this will only update the Fact column of the row
            $data = @{
                Fact = $response
            }

            $data | Update-PodeWebTableRow -TableId $ElementData.Parent.ID -Id $WebEvent.Data['value']
        }

        # load all catfacts
        $response = (Invoke-RestMethod -Uri 'https://catfact.ninja/facts?limit=10' -Method Get).data
        for ($i = 0; $i -lt $response.Length; $i++) {
            [ordered]@{
                ID     = $i
                Fact   = $response[$i].fact
                Action = $refreshBtn
            }
        }
    }

    Add-PodeWebPage -Name 'Get Cat Fact' -Icon 'Upload-Cloud' -Layouts $table
}