import React from 'react';
import Grid from '@mui/material/Grid';
import axios from 'axios';
import { useState, useEffect } from 'react';
import RestrictionTable2 from '../components/restrictions/restrictionTable2';
import RestrictionForm from '../components/restrictions/restrictionForm';
import AddButton from '../components/shared/addButton';

export default function RestrictionPage({ thisTenant, tenantValues, env, token }) {
  const [data, setData] = useState([]);
  const [open, setOpen] = useState(false);
  const [newRestr, setNewRestr] = useState(false);
  const [agentsTypes, setagentsTypes] = React.useState([]);

  const GeTenantData = (type) => {
    const tenantArray = tenantValues.filter((e) => e.id === thisTenant);
    if (type === 'name') {
      return tenantArray[0].name;
    } else {
      return tenantArray[0].id;
    }
  };

  React.useEffect(() => {
    if (!(thisTenant === null || typeof thisTenant === 'undefined')) {
      axios
        .get((typeof env !== 'undefined' ? env.ANUBIS_API_URL : '') + 'v1/policies/agent-types', {
          headers: {}
        })
        .then((response) => setagentsTypes(response.data))
        .catch((err) => console.error(err));
    }
    console.log('agentsTypes ====', agentsTypes);
  }, [thisTenant]);

  const changeData = (newData) => {
    // console.log('newData reçue de restrictionForm :', newData);
    setData(newData);
  };

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:8085/v1/restrictions/', {
        headers: { Accept: 'application/json' }
      });
      setData(response.data);
      console.log(response);
    } catch (error) {
      console.error('Erreur lors de la requête GET :', error);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [newRestr]);

  return (
    <Grid container spacing={2}>
      <Grid>
        <Grid item xs={12}>
          <Grid container spacing={2} direction="column">
            <Grid item xs={12}>
              <RestrictionTable2
                data={data}
                setNewData={changeData}
                onClose={() => setOpen(false)}
                thisTenant={thisTenant}
                tenantValues={tenantValues}
                setNewRestr={setNewRestr}
                tenantName={GeTenantData}
                agentsTypes={agentsTypes}
                env={env}
                token={token}
              />
            </Grid>
          </Grid>
        </Grid>
        <AddButton
          pageType={
            <RestrictionForm
              onClose={() => setOpen(false)}
              thisTenant={thisTenant}
              tenantValues={tenantValues}
              setNewRestr={setNewRestr}
              tenantName={GeTenantData}
              agentsTypes={agentsTypes}
              env={env}
              token={token}
              action={'create'}
            />
          }
          setOpen={setOpen}
          status={open}
          graphqlErrors={null}
        ></AddButton>
      </Grid>
    </Grid>
  );
}
